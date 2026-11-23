import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap';
import {
  HERO_CAMERA_DESKTOP,
  HERO_CAMERA_MOBILE,
  PRODUCTS,
} from './products';
import {
  createBrushedMetalTextures,
  createContactShadowTexture,
  createDacOledTexture,
  createMerinoFeltTextures,
  createMonitorScreenTexture,
  createWalnutTextures,
} from './proceduralTextures';

export type AtmosphereMode = 'night' | 'day';

export interface HotspotProjection {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface DeskSceneCallbacks {
  onLoadProgress?: (percent: number) => void;
  onReady?: () => void;
  onWebGLError?: (message: string) => void;
  onProductHover?: (productId: string | null) => void;
  onProductClick?: (productId: string) => void;
  onHotspotsProject?: (projections: HotspotProjection[]) => void;
}

interface InteractiveProductRig {
  id: string;
  group: THREE.Group;
  baseY: number;
  currentElevation: number;
  targetElevation: number;
  contactShadow: THREE.Mesh;
  rimLight: THREE.PointLight;
  accentEmissiveMaterials: THREE.MeshStandardMaterial[];
  baseEmissiveIntensity: number;
  hotspotAnchor: THREE.Vector3;
  proxyMesh: THREE.Mesh;
}

/**
 * Software WebGL detector (SwiftShader / llvmpipe / WARP).
 * Used strictly to scale rendering cost without changing scene content or layout.
 */
function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * Rounded rectangle THREE.Shape helper for ExtrudeGeometry bevel profiles.
 */
function createRoundedRectShape(width: number, depth: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -depth / 2;
  const r = Math.min(radius, width / 2, depth / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + depth - r);
  shape.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
  shape.lineTo(x + r, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

export class DeskDioramaEngine {
  private container: HTMLElement;
  private callbacks: DeskSceneCallbacks;
  private isSoftwareGl: boolean;
  private isMobile: boolean;
  private disposed = false;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private frameId = 0;

  // Lighting & Atmosphere handles
  private bgColor = new THREE.Color('#08111A');
  private fog!: THREE.FogExp2;
  private hemiLight!: THREE.HemisphereLight;
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private lightBarSpot!: THREE.SpotLight;
  private lightBarRect: THREE.RectAreaLight | null = null;
  private lightBarEmissiveMat!: THREE.MeshStandardMaterial;
  private keyboardUnderglowMat!: THREE.MeshStandardMaterial;
  private monitorScreenMat!: THREE.MeshStandardMaterial;
  private studioFloorMat!: THREE.MeshStandardMaterial;
  private backWallMat!: THREE.MeshStandardMaterial;
  private dustMaterial!: THREE.ShaderMaterial;
  private dacDialGroup!: THREE.Group;

  // Interactive product groups & raycasting
  private productRigs = new Map<string, InteractiveProductRig>();
  private proxyMeshes: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2(-99, -99);
  private pointerNormalized = new THREE.Vector2(0, 0);
  private lastRaycastTime = 0;
  private hoveredProductId: string | null = null;
  private pointerDownPos = new THREE.Vector2();

  // Camera choreography state (zero-GC pre-allocated vectors)
  private activeActIndex = 0; // 0 = Hero, 1..5 = PRODUCTS[0..4]
  private desiredCamPos = new THREE.Vector3(...HERO_CAMERA_DESKTOP.position);
  private desiredLookAt = new THREE.Vector3(...HERO_CAMERA_DESKTOP.target);
  private currentLookAt = new THREE.Vector3(...HERO_CAMERA_DESKTOP.target);
  private desiredFov = HERO_CAMERA_DESKTOP.fov ?? 38;
  private atmosphere: AtmosphereMode = 'night';

  private _projVec = new THREE.Vector3();
  private _parallaxPos = new THREE.Vector3();
  private _tempLook = new THREE.Vector3();
  private _hotspotResults: HotspotProjection[] = PRODUCTS.map((p) => ({
    id: p.id,
    x: 0,
    y: 0,
    visible: false,
  }));

  // Cleanup tracking
  private disposables: Array<{ dispose: () => void }> = [];

  // Optional external loaders ready for future .glb / .hdr swap-ins
  private gltfLoader = new GLTFLoader();
  private rgbeLoader = new RGBELoader();

  constructor(container: HTMLElement, callbacks: DeskSceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.isMobile = window.innerWidth <= 768;

    this.init();
  }

  private init(): void {
    this.callbacks.onLoadProgress?.(12);

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      this.callbacks.onWebGLError?.(
        'WebGL hardware rendering is unavailable in this browser session.'
      );
      return;
    }

    const dprCap = this.isSoftwareGl ? 1 : this.isMobile ? 1.5 : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dprCap);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.setAttribute('aria-label', 'Interactive 3D DeskNest Setup');
    this.container.appendChild(canvas);

    canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);

    this.scene = new THREE.Scene();
    this.scene.background = this.bgColor;
    this.fog = new THREE.FogExp2(this.bgColor.getHex(), 0.085);
    this.scene.fog = this.fog;

    const initialPreset = this.isMobile ? HERO_CAMERA_MOBILE : HERO_CAMERA_DESKTOP;
    this.desiredCamPos.set(...initialPreset.position);
    this.desiredLookAt.set(...initialPreset.target);
    this.currentLookAt.set(...initialPreset.target);
    this.desiredFov = initialPreset.fov ?? 38;

    this.camera = new THREE.PerspectiveCamera(
      this.desiredFov,
      window.innerWidth / window.innerHeight,
      0.08,
      45
    );
    this.camera.position.copy(this.desiredCamPos);
    this.camera.lookAt(this.currentLookAt);

    this.callbacks.onLoadProgress?.(30);

    // Mandatory studio environment map for metallic/anisotropic reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    this.scene.environment = envTarget.texture;
    this.scene.environmentIntensity = 0.52;
    roomEnv.dispose();
    pmremGenerator.dispose();
    this.disposables.push(envTarget);

    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
    }

    this.callbacks.onLoadProgress?.(48);
    this.setupLighting();
    this.buildDeskArchitecture();
    this.callbacks.onLoadProgress?.(72);
    this.buildInteractiveProducts();
    this.buildAmbientDustMotes();
    this.callbacks.onLoadProgress?.(92);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.callbacks.onLoadProgress?.(100);
    this.callbacks.onReady?.();
    this.startLoop();
  }

  /**
   * ---------------------------------------------------------------------------
   * DROP-IN ASSET HOOKS (Sketchfab / Spline .GLB & Poly Haven .HDR)
   * ---------------------------------------------------------------------------
   * Call `engine.loadExternalHDRI('/assets/studio_small_09_2k.hdr')` to swap
   * the procedural RoomEnvironment for a Poly Haven equirectangular HDR map.
   */
  public loadExternalHDRI(hdrUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      pmrem.compileEquirectangularShader();
      this.rgbeLoader.load(
        hdrUrl,
        (hdrTexture) => {
          const envRT = pmrem.fromEquirectangular(hdrTexture);
          this.scene.environment = envRT.texture;
          hdrTexture.dispose();
          pmrem.dispose();
          this.disposables.push(envRT);
          resolve();
        },
        undefined,
        (err) => {
          pmrem.dispose();
          reject(err);
        }
      );
    });
  }

  /**
   * Call `engine.loadExternalGLTFModel('cnc-keyboard', '/models/keyboard.glb')`
   * to replace any procedural product group with an external Sketchfab/Spline GLB.
   */
  public loadExternalGLTFModel(productId: string, glbUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const rig = this.productRigs.get(productId);
      if (!rig) {
        reject(new Error(`Unknown product id: ${productId}`));
        return;
      }
      this.gltfLoader.load(
        glbUrl,
        (gltf) => {
          // Clear procedural meshes except proxy hit box
          const toRemove = rig.group.children.filter((c) => c !== rig.proxyMesh);
          toRemove.forEach((child) => rig.group.remove(child));
          gltf.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              obj.castShadow = true;
              obj.receiveShadow = true;
            }
          });
          rig.group.add(gltf.scene);
          resolve();
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  private setupLighting(): void {
    // Cool ambient hemisphere fill to balance warm 2700K accents
    this.hemiLight = new THREE.HemisphereLight('#8CA4C8', '#1A1614', 0.42);
    this.scene.add(this.hemiLight);

    // Primary studio key light (warm architectural directional)
    this.keyLight = new THREE.DirectionalLight('#FFEAD0', 1.45);
    this.keyLight.position.set(2.8, 4.6, 2.9);
    this.keyLight.castShadow = !this.isSoftwareGl;
    const shadowRes = this.isMobile ? 512 : 2048;
    this.keyLight.shadow.mapSize.set(shadowRes, shadowRes);
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 14;
    this.keyLight.shadow.camera.left = -2.4;
    this.keyLight.shadow.camera.right = 2.4;
    this.keyLight.shadow.camera.top = 2.2;
    this.keyLight.shadow.camera.bottom = -2.0;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.keyLight.shadow.radius = 3.5;
    this.scene.add(this.keyLight);

    // Cool rim / architectural separation fill from opposite back-left
    this.fillLight = new THREE.DirectionalLight('#90A8CC', 0.58);
    this.fillLight.position.set(-3.4, 2.2, -2.4);
    this.scene.add(this.fillLight);
  }

  private buildDeskArchitecture(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const { map: metalMap, roughnessMap: metalRough } = createBrushedMetalTextures('#15171C', maxAniso);
    this.disposables.push(metalMap, metalRough);

    const deskGroup = new THREE.Group();
    deskGroup.name = 'architectural-desk-base';

    // Matte obsidian-graphite architectural desk slab (beveled edges via ExtrudeGeometry)
    const deskShape = createRoundedRectShape(2.85, 1.45, 0.035);
    const deskGeo = new THREE.ExtrudeGeometry(deskShape, {
      depth: 0.052,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    deskGeo.rotateX(Math.PI / 2);

    const deskTopMat = new THREE.MeshStandardMaterial({
      color: '#17191E',
      map: metalMap,
      roughnessMap: metalRough,
      roughness: 0.72,
      metalness: 0.14,
    });
    const deskSlab = new THREE.Mesh(deskGeo, deskTopMat);
    deskSlab.position.set(0, -0.008, 0.02); // Top surface sits cleanly at Y = 0
    deskSlab.receiveShadow = true;
    deskSlab.castShadow = true;
    deskGroup.add(deskSlab);

    // Warm walnut chamfered front edge inlay strip along the desk lip
    const inlayGeo = new THREE.BoxGeometry(2.74, 0.009, 0.012);
    const inlayMat = new THREE.MeshStandardMaterial({
      color: '#8B5A2B',
      roughness: 0.42,
      metalness: 0.12,
    });
    const frontInlay = new THREE.Mesh(inlayGeo, inlayMat);
    frontInlay.position.set(0, -0.028, 0.746);
    deskGroup.add(frontInlay);

    // Anodized tubular steel architectural legs & under-frame crossbar
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#111317',
      roughness: 0.36,
      metalness: 0.85,
    });

    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.045, 0.06), frameMat);
    crossbar.position.set(0, -0.1, -0.12);
    deskGroup.add(crossbar);

    [-1.12, 1.12].forEach((lx) => {
      const legCol = new THREE.Mesh(new THREE.BoxGeometry(0.065, 1.35, 0.085), frameMat);
      legCol.position.set(lx, -0.74, -0.06);
      legCol.castShadow = true;
      deskGroup.add(legCol);

      const footBar = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.028, 0.96), frameMat);
      footBar.position.set(lx, -1.4, 0.02);
      deskGroup.add(footBar);
    });

    // Expansive studio ground horizon plane
    const studioFloorGeo = new THREE.PlaneGeometry(36, 36);
    this.studioFloorMat = new THREE.MeshStandardMaterial({
      color: '#09131E',
      roughness: 0.92,
      metalness: 0.04,
    });
    const studioFloor = new THREE.Mesh(studioFloorGeo, this.studioFloorMat);
    studioFloor.rotation.x = -Math.PI / 2;
    studioFloor.position.y = -1.42;
    studioFloor.receiveShadow = true;
    deskGroup.add(studioFloor);

    // Subtle matte backdrop architectural wall divider behind desk
    const wallGeo = new THREE.PlaneGeometry(18, 8);
    this.backWallMat = new THREE.MeshStandardMaterial({
      color: '#0B1724',
      roughness: 0.94,
      metalness: 0.02,
    });
    const backWall = new THREE.Mesh(wallGeo, this.backWallMat);
    backWall.position.set(0, 2.5, -1.55);
    backWall.receiveShadow = true;
    deskGroup.add(backWall);

    this.scene.add(deskGroup);
    this.disposables.push(
      deskGeo,
      deskTopMat,
      inlayGeo,
      inlayMat,
      frameMat,
      studioFloorGeo,
      this.studioFloorMat,
      wallGeo,
      this.backWallMat
    );
  }

  private buildInteractiveProducts(): void {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const walnutTex = createWalnutTextures(maxAniso);
    const tungstenMetalTex = createBrushedMetalTextures('#8C93A0', maxAniso);
    const darkAluminumTex = createBrushedMetalTextures('#20242C', maxAniso);
    const merinoTex = createMerinoFeltTextures(maxAniso);
    const monitorScreenTex = createMonitorScreenTexture(maxAniso);
    const dacOledTex = createDacOledTexture(maxAniso);
    const contactShadowTex = createContactShadowTexture();

    this.disposables.push(
      walnutTex.map,
      walnutTex.bumpMap,
      tungstenMetalTex.map,
      tungstenMetalTex.roughnessMap,
      darkAluminumTex.map,
      darkAluminumTex.roughnessMap,
      merinoTex.map,
      merinoTex.bumpMap,
      monitorScreenTex,
      dacOledTex,
      contactShadowTex
    );

    const walnutMat = new THREE.MeshPhysicalMaterial({
      map: walnutTex.map,
      bumpMap: walnutTex.bumpMap,
      bumpScale: 0.008,
      roughness: 0.44,
      metalness: 0.04,
      clearcoat: 0.24,
      clearcoatRoughness: 0.48,
    });

    const powderSteelMat = new THREE.MeshStandardMaterial({
      color: '#14161B',
      roughness: 0.62,
      metalness: 0.72,
    });

    const anodizedTungstenMat = new THREE.MeshPhysicalMaterial({
      color: '#A8AFBC',
      map: tungstenMetalTex.map,
      roughnessMap: tungstenMetalTex.roughnessMap,
      roughness: 0.26,
      metalness: 0.92,
      anisotropy: 0.65,
    });

    const darkCncAluminumMat = new THREE.MeshPhysicalMaterial({
      color: '#232730',
      map: darkAluminumTex.map,
      roughnessMap: darkAluminumTex.roughnessMap,
      roughness: 0.3,
      metalness: 0.88,
      anisotropy: 0.55,
    });

    const brushedBrassMat = new THREE.MeshPhysicalMaterial({
      color: '#C79B4B',
      roughness: 0.24,
      metalness: 0.95,
      anisotropy: 0.7,
    });

    this.disposables.push(
      walnutMat,
      powderSteelMat,
      anodizedTungstenMat,
      darkCncAluminumMat,
      brushedBrassMat
    );

    // =========================================================================
    // PRODUCT 1: KURODA SOLID WALNUT & STEEL DESK SHELF (Center-Back)
    // =========================================================================
    {
      const group = new THREE.Group();
      group.name = 'walnut-shelf';
      group.position.set(0, 0, -0.52);

      // Beveled walnut top slab
      const slabShape = createRoundedRectShape(1.52, 0.34, 0.018);
      const slabGeo = new THREE.ExtrudeGeometry(slabShape, {
        depth: 0.026,
        bevelEnabled: true,
        bevelThickness: 0.005,
        bevelSize: 0.005,
        bevelSegments: 3,
      });
      slabGeo.rotateX(Math.PI / 2);
      const slabMesh = new THREE.Mesh(slabGeo, walnutMat);
      slabMesh.position.set(0, 0.145, 0);
      slabMesh.castShadow = true;
      slabMesh.receiveShadow = true;
      group.add(slabMesh);

      // Twin folded powder-coated steel leg brackets + cork base pads
      const corkMat = new THREE.MeshStandardMaterial({
        color: '#6E5038',
        roughness: 0.92,
        metalness: 0.0,
      });
      [-0.56, 0.56].forEach((xPos) => {
        const legSide = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.116, 0.27), powderSteelMat);
        legSide.position.set(xPos, 0.062, 0);
        legSide.castShadow = true;
        legSide.receiveShadow = true;
        group.add(legSide);

        const legFoot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.27), powderSteelMat);
        legFoot.position.set(xPos + (xPos < 0 ? 0.034 : -0.034), 0.008, 0);
        legFoot.receiveShadow = true;
        group.add(legFoot);

        const corkPad = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.004, 0.26), corkMat);
        corkPad.position.set(xPos + (xPos < 0 ? 0.034 : -0.034), 0.002, 0);
        group.add(corkPad);
      });

      // Recessed anodized aluminum mid-bay storage shelf
      const trayMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.11, 0.008, 0.23),
        darkCncAluminumMat
      );
      trayMesh.position.set(0, 0.064, -0.01);
      trayMesh.receiveShadow = true;
      trayMesh.castShadow = true;
      group.add(trayMesh);

      // Subtle DeskNest emerald under-shelf accent strip
      const shelfAccentMat = new THREE.MeshStandardMaterial({
        color: '#00C896',
        emissive: '#00C896',
        emissiveIntensity: 0.4,
        roughness: 0.3,
      });
      const underStrip = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.004, 0.008), shelfAccentMat);
      underStrip.position.set(0, 0.114, -0.11);
      group.add(underStrip);

      // Architectural studio sketchbook & machined aluminum paperweight inside lower bay
      const bookMat = new THREE.MeshStandardMaterial({
        color: '#1C1F26',
        roughness: 0.85,
        metalness: 0.05,
      });
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.022, 0.18), bookMat);
      book.position.set(-0.28, 0.079, 0.01);
      book.rotation.y = 0.04;
      book.castShadow = true;
      group.add(book);

      const brassGrommet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.008, 24),
        brushedBrassMat
      );
      brassGrommet.position.set(0.45, 0.148, -0.09);
      group.add(brassGrommet);

      // Small machined pen resting on shelf
      const pen = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0055, 0.0055, 0.15, 16),
        anodizedTungstenMat
      );
      pen.rotation.z = Math.PI / 2;
      pen.rotation.y = 0.18;
      pen.position.set(0.32, 0.075, 0.03);
      group.add(pen);

      this.registerProductRig(
        'walnut-shelf',
        group,
        [1.56, 0.18, 0.38],
        [0, 0.08, 0],
        [1.72, 0.56],
        [0, 0.25, -0.35],
        [shelfAccentMat],
        0.35,
        contactShadowTex
      );
      this.disposables.push(slabGeo, corkMat, shelfAccentMat, bookMat);
    }

    // =========================================================================
    // PRODUCT 2: AETHER 38" CURVED ULTRAWIDE MONITOR + ASYMMETRIC LIGHT BAR
    // =========================================================================
    {
      const group = new THREE.Group();
      group.name = 'ultrawide-monitor';
      group.position.set(0, 0.146, -0.58); // Rests cleanly atop the walnut desk shelf

      // Weighted CNC Aluminum monitor stand base & angled neck
      const baseShape = createRoundedRectShape(0.38, 0.22, 0.024);
      const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
        depth: 0.014,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
        bevelSegments: 2,
      });
      baseGeo.rotateX(Math.PI / 2);
      const standBase = new THREE.Mesh(baseGeo, anodizedTungstenMat);
      standBase.position.set(0, 0.017, 0.02);
      standBase.castShadow = true;
      standBase.receiveShadow = true;
      group.add(standBase);

      const standStem = new THREE.Mesh(
        new THREE.BoxGeometry(0.068, 0.52, 0.024),
        anodizedTungstenMat
      );
      standStem.position.set(0, 0.27, -0.055);
      standStem.rotation.x = -0.08;
      standStem.castShadow = true;
      group.add(standStem);

      const vesaHub = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.12, 0.035),
        darkCncAluminumMat
      );
      vesaHub.position.set(0, 0.52, -0.03);
      group.add(vesaHub);

      // Curved 38" 2300R Panel built from inward-facing CylinderGeometry arc
      const curveRadius = 2.65;
      const arcAngle = 0.52; // ~1.38m visual studio scale
      const panelHeight = 0.56;
      const panelCenterY = 0.58;
      const panelCenterZ = curveRadius - 0.02;

      // Outer curved gunmetal housing (back shell)
      const backShellGeo = new THREE.CylinderGeometry(
        curveRadius + 0.024,
        curveRadius + 0.024,
        panelHeight + 0.028,
        48,
        1,
        true,
        Math.PI - arcAngle / 2,
        arcAngle
      );
      const backShell = new THREE.Mesh(backShellGeo, darkCncAluminumMat);
      backShell.position.set(0, panelCenterY, panelCenterZ);
      backShell.material.side = THREE.DoubleSide;
      backShell.castShadow = true;
      group.add(backShell);

      // Front bezel frame arc
      const bezelGeo = new THREE.CylinderGeometry(
        curveRadius + 0.008,
        curveRadius + 0.008,
        panelHeight + 0.024,
        48,
        1,
        true,
        Math.PI - arcAngle / 2 - 0.005,
        arcAngle + 0.01
      );
      const bezelMat = new THREE.MeshStandardMaterial({
        color: '#0D0F13',
        roughness: 0.35,
        metalness: 0.7,
        side: THREE.BackSide,
      });
      const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
      bezelMesh.position.set(0, panelCenterY, panelCenterZ);
      group.add(bezelMesh);

      // Top & bottom curved anodized chin / trim strips
      const topTrimGeo = new THREE.CylinderGeometry(
        curveRadius + 0.024,
        curveRadius + 0.008,
        0.014,
        48,
        1,
        true,
        Math.PI - arcAngle / 2,
        arcAngle
      );
      const topTrim = new THREE.Mesh(topTrimGeo, anodizedTungstenMat);
      topTrim.material.side = THREE.DoubleSide;
      topTrim.position.set(0, panelCenterY + panelHeight / 2 + 0.012, panelCenterZ);
      group.add(topTrim);

      const bottomTrim = topTrim.clone();
      bottomTrim.position.set(0, panelCenterY - panelHeight / 2 - 0.012, panelCenterZ);
      group.add(bottomTrim);

      // Curved emissive screen surface (facing viewer along +Z via BackSide on cylinder at +Z)
      const screenGeo = new THREE.CylinderGeometry(
        curveRadius,
        curveRadius,
        panelHeight - 0.014,
        48,
        1,
        true,
        Math.PI - (arcAngle - 0.014) / 2,
        arcAngle - 0.014
      );
      // Flip UVs horizontally because we view the inside (BackSide) of the cylinder
      const uvAttr = screenGeo.attributes.uv;
      for (let i = 0; i < uvAttr.count; i++) {
        uvAttr.setX(i, 1 - uvAttr.getX(i));
      }
      uvAttr.needsUpdate = true;

      this.monitorScreenMat = new THREE.MeshStandardMaterial({
        map: monitorScreenTex,
        emissiveMap: monitorScreenTex,
        emissive: new THREE.Color('#FFFFFF'),
        emissiveIntensity: 0.88,
        roughness: 0.22,
        metalness: 0.08,
        side: THREE.BackSide,
      });
      const screenMesh = new THREE.Mesh(screenGeo, this.monitorScreenMat);
      screenMesh.position.set(0, panelCenterY, panelCenterZ);
      group.add(screenMesh);

      // ASYMMETRIC MONITOR LIGHT BAR mounted cleanly atop center bezel
      const lightBarGroup = new THREE.Group();
      lightBarGroup.position.set(0, panelCenterY + panelHeight / 2 + 0.032, 0.032);

      const barTube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.56, 24),
        anodizedTungstenMat
      );
      barTube.rotation.z = Math.PI / 2;
      barTube.castShadow = true;
      lightBarGroup.add(barTube);

      // End caps in machined brass
      [-0.285, 0.285].forEach((ex) => {
        const cap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0145, 0.0145, 0.014, 24),
          brushedBrassMat
        );
        cap.rotation.z = Math.PI / 2;
        cap.position.x = ex;
        lightBarGroup.add(cap);
      });

      // Counterweight saddle clamp behind bezel
      const clampArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.056, 0.045, 0.082),
        darkCncAluminumMat
      );
      clampArm.position.set(0, -0.014, -0.036);
      lightBarGroup.add(clampArm);

      // Emissive warm-neutral white LED diffuser strip angled forward-down onto desk
      this.lightBarEmissiveMat = new THREE.MeshStandardMaterial({
        color: '#FFFDF8',
        emissive: new THREE.Color('#FFF1DA'),
        emissiveIntensity: 3.1,
        roughness: 0.15,
      });
      const diffuserStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.008, 0.012),
        this.lightBarEmissiveMat
      );
      diffuserStrip.position.set(0, -0.012, 0.008);
      diffuserStrip.rotation.x = 0.35;
      lightBarGroup.add(diffuserStrip);

      // Realistic warm-neutral white SpotLight so natural walnut grain stays true
      this.lightBarSpot = new THREE.SpotLight('#FFF0D6', 3.5, 3.8, Math.PI * 0.38, 0.72, 1.45);
      this.lightBarSpot.position.set(0, -0.02, 0.06);
      this.lightBarSpot.castShadow = !this.isSoftwareGl && !this.isMobile;
      this.lightBarSpot.shadow.mapSize.set(1024, 1024);
      this.lightBarSpot.shadow.bias = -0.0005;
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(0, -1.02, 0.85);
      lightBarGroup.add(spotTarget);
      this.lightBarSpot.target = spotTarget;
      lightBarGroup.add(this.lightBarSpot);

      // Studio RectAreaLight for clean neutral-warm specular sheen on aluminum & walnut (GPU only)
      if (!this.isSoftwareGl) {
        this.lightBarRect = new THREE.RectAreaLight('#FFECD2', 4.0, 0.56, 0.06);
        this.lightBarRect.position.set(0, -0.022, 0.04);
        this.lightBarRect.lookAt(0, -0.85, 0.62);
        lightBarGroup.add(this.lightBarRect);
      }

      group.add(lightBarGroup);

      this.registerProductRig(
        'ultrawide-monitor',
        group,
        [1.42, 0.92, 0.32],
        [0, 0.5, 0.02],
        [0.44, 0.28],
        [0, 0.92, 0.12],
        [this.lightBarEmissiveMat],
        3.4,
        contactShadowTex
      );
      this.disposables.push(baseGeo, backShellGeo, bezelGeo, bezelMat, topTrimGeo, screenGeo);
    }

    // =========================================================================
    // PRODUCT 3: MONOLITH 75% CNC ALUMINUM MECHANICAL KEYBOARD
    // =========================================================================
    {
      const group = new THREE.Group();
      group.name = 'cnc-keyboard';
      group.position.set(-0.08, 0.009, 0.32); // Sits cleanly on the merino wool mat

      // 6-degree angled CNC 6063 aluminum chassis via ExtrudeGeometry side profile
      const kbW = 0.58;
      const kbD = 0.235;
      const chassisProfile = new THREE.Shape();
      chassisProfile.moveTo(-kbD / 2, 0.006);
      chassisProfile.lineTo(kbD / 2, 0.006);
      chassisProfile.lineTo(kbD / 2, 0.024);
      chassisProfile.lineTo(-kbD / 2, 0.044);
      chassisProfile.closePath();

      const chassisGeo = new THREE.ExtrudeGeometry(chassisProfile, {
        depth: kbW,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
      });
      // Orient extrusion along X axis centered
      chassisGeo.rotateY(Math.PI / 2);
      chassisGeo.translate(-kbW / 2, 0, 0);

      const chassisMesh = new THREE.Mesh(chassisGeo, darkCncAluminumMat);
      chassisMesh.castShadow = true;
      chassisMesh.receiveShadow = true;
      group.add(chassisMesh);

      // Machined brass rear accent weight bar
      const brassWeight = new THREE.Mesh(
        new THREE.BoxGeometry(kbW * 0.72, 0.012, 0.008),
        brushedBrassMat
      );
      brassWeight.position.set(0, 0.025, -kbD / 2 - 0.004);
      group.add(brassWeight);

      // Recessed dark switch plate tilted to match 6-degree chassis slope
      const slopeAngle = Math.atan2(0.02, kbD);
      const keyCluster = new THREE.Group();
      keyCluster.position.set(0, 0.035, 0);
      keyCluster.rotation.x = slopeAngle;
      group.add(keyCluster);

      const plateMesh = new THREE.Mesh(
        new THREE.BoxGeometry(kbW - 0.028, 0.004, kbD - 0.028),
        powderSteelMat
      );
      plateMesh.position.y = -0.003;
      keyCluster.add(plateMesh);

      // Procedural 75% keycap layout using InstancedMesh (5 rows, 81 sculpted keys)
      const keycapGeo = new THREE.BoxGeometry(1, 0.013, 1);
      const keycapMat = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.62,
        metalness: 0.06,
      });

      interface KeySpec {
        u: number;
        row: number;
        colOffset: number;
        color: string;
      }

      const keySpecs: KeySpec[] = [];
      const rowDefs: Array<Array<{ u: number; accent?: 'amber' | 'walnut' | 'mod' }>> = [
        // Row 0: Esc + F1..F12 + Del (leaving top-right slot for rotary knob)
        [
          { u: 1, accent: 'amber' },
          ...Array.from({ length: 13 }, (_, idx) => ({
            u: 1,
            accent: idx >= 4 && idx <= 7 ? ('mod' as const) : undefined,
          })),
        ],
        // Row 1: Number row + Backspace + Home
        [
          { u: 1, accent: 'mod' },
          ...Array.from({ length: 12 }, () => ({ u: 1 })),
          { u: 2, accent: 'mod' },
          { u: 1, accent: 'mod' },
        ],
        // Row 2: Tab + QWERTY + PgUp
        [
          { u: 1.5, accent: 'mod' },
          ...Array.from({ length: 12 }, () => ({ u: 1 })),
          { u: 1.5, accent: 'mod' },
          { u: 1, accent: 'mod' },
        ],
        // Row 3: Caps + ASDF + Enter + PgDn
        [
          { u: 1.75, accent: 'mod' },
          ...Array.from({ length: 11 }, () => ({ u: 1 })),
          { u: 2.25, accent: 'walnut' },
          { u: 1, accent: 'mod' },
        ],
        // Row 4: Shift + ZXCV + Shift + Up + End
        [
          { u: 2.25, accent: 'mod' },
          ...Array.from({ length: 10 }, () => ({ u: 1 })),
          { u: 1.75, accent: 'mod' },
          { u: 1, accent: 'mod' },
          { u: 1, accent: 'mod' },
        ],
        // Row 5: Modifiers + Spacebar + Arrows
        [
          { u: 1.25, accent: 'mod' },
          { u: 1.25, accent: 'mod' },
          { u: 1.25, accent: 'mod' },
          { u: 6.25, accent: 'walnut' },
          { u: 1, accent: 'mod' },
          { u: 1, accent: 'mod' },
          { u: 1, accent: 'mod' },
          { u: 1, accent: 'mod' },
          { u: 1, accent: 'mod' },
          { u: 1, accent: 'mod' },
        ],
      ];

      const unitPitch = 0.0342;
      const keyGap = 0.0038;
      const rowPitch = 0.0342;
      const totalCols = 16;
      const startX = -(totalCols * unitPitch) / 2;
      const startZ = -((rowDefs.length - 1) * rowPitch) / 2;

      rowDefs.forEach((row, rIdx) => {
        let cursor = 0;
        row.forEach((k) => {
          const color =
            k.accent === 'amber'
              ? '#008B6B'
              : k.accent === 'walnut'
                ? '#7B4E26'
                : k.accent === 'mod'
                  ? '#1A2433'
                  : '#2A3442';
          keySpecs.push({
            u: k.u,
            row: rIdx,
            colOffset: cursor + k.u / 2,
            color,
          });
          cursor += k.u;
        });
      });

      const instancedKeys = new THREE.InstancedMesh(keycapGeo, keycapMat, keySpecs.length);
      instancedKeys.castShadow = true;
      instancedKeys.receiveShadow = true;

      const dummy = new THREE.Object3D();
      const tmpColor = new THREE.Color();

      keySpecs.forEach((ks, i) => {
        const kw = ks.u * unitPitch - keyGap;
        const kd = rowPitch - keyGap;
        const sculptedH = ks.row === 0 || ks.row === 1 ? 1.15 : ks.row === 5 ? 0.92 : 1.0;

        dummy.position.set(
          startX + ks.colOffset * unitPitch,
          0.006 * sculptedH,
          startZ + ks.row * rowPitch
        );
        dummy.scale.set(kw, sculptedH, kd);
        dummy.updateMatrix();
        instancedKeys.setMatrixAt(i, dummy.matrix);
        tmpColor.set(ks.color);
        instancedKeys.setColorAt(i, tmpColor);
      });
      instancedKeys.instanceMatrix.needsUpdate = true;
      if (instancedKeys.instanceColor) instancedKeys.instanceColor.needsUpdate = true;
      instancedKeys.computeBoundingSphere();
      keyCluster.add(instancedKeys);

      // Top-right machined rotary volume encoder on the 75% keyboard
      const kbKnob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.015, 0.017, 24),
        anodizedTungstenMat
      );
      kbKnob.position.set(startX + 15.1 * unitPitch, 0.01, startZ);
      kbKnob.castShadow = true;
      keyCluster.add(kbKnob);

      // Refined DeskNest Emerald (#00C896) perimeter underglow diffuser strip
      this.keyboardUnderglowMat = new THREE.MeshStandardMaterial({
        color: '#00C896',
        emissive: new THREE.Color('#00C896'),
        emissiveIntensity: 1.55,
        roughness: 0.25,
      });
      const underglowBar = new THREE.Mesh(
        new THREE.BoxGeometry(kbW - 0.02, 0.005, kbD - 0.02),
        this.keyboardUnderglowMat
      );
      underglowBar.position.set(0, 0.004, 0);
      group.add(underglowBar);

      // Coiled aviator USB-C cable running from rear-left of keyboard
      const coilPoints: THREE.Vector3[] = [];
      const coilTurns = 14;
      for (let i = 0; i <= 140; i++) {
        const t = i / 140;
        const angle = t * Math.PI * 2 * coilTurns;
        coilPoints.push(
          new THREE.Vector3(
            -0.18 + t * 0.22,
            0.016 + Math.sin(angle) * 0.012,
            -kbD / 2 - 0.055 + Math.cos(angle) * 0.012
          )
        );
      }
      const coilCurve = new THREE.CatmullRomCurve3(coilPoints);
      const coilGeo = new THREE.TubeGeometry(coilCurve, 120, 0.0038, 8, false);
      const cableMat = new THREE.MeshStandardMaterial({
        color: '#2A2D35',
        roughness: 0.78,
        metalness: 0.1,
      });
      const coilMesh = new THREE.Mesh(coilGeo, cableMat);
      coilMesh.castShadow = true;
      group.add(coilMesh);

      const aviatorBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.048, 16),
        anodizedTungstenMat
      );
      aviatorBarrel.rotation.z = Math.PI / 2;
      aviatorBarrel.position.set(0.075, 0.016, -kbD / 2 - 0.055);
      group.add(aviatorBarrel);

      this.registerProductRig(
        'cnc-keyboard',
        group,
        [0.62, 0.08, 0.28],
        [0, 0.03, 0],
        [0.68, 0.34],
        [0, 0.18, 0.05],
        [this.keyboardUnderglowMat],
        1.55,
        contactShadowTex
      );
      this.disposables.push(chassisGeo, keycapGeo, keycapMat, coilGeo, cableMat);
    }

    // =========================================================================
    // PRODUCT 4: FORMA SCULPTED WIRELESS MOUSE + MERINO WOOL DESK MAT
    // =========================================================================
    {
      // Merino wool desk mat sits flush on the desk underneath keyboard & mouse
      const matShape = createRoundedRectShape(1.66, 0.66, 0.028);
      const matGeo = new THREE.ExtrudeGeometry(matShape, {
        depth: 0.005,
        bevelEnabled: true,
        bevelThickness: 0.002,
        bevelSize: 0.002,
        bevelSegments: 2,
      });
      matGeo.rotateX(Math.PI / 2);
      const merinoMat = new THREE.MeshStandardMaterial({
        map: merinoTex.map,
        bumpMap: merinoTex.bumpMap,
        bumpScale: 0.006,
        roughness: 0.96,
        metalness: 0.0,
      });
      const deskMatMesh = new THREE.Mesh(matGeo, merinoMat);
      deskMatMesh.position.set(0.14, 0.007, 0.32);
      deskMatMesh.receiveShadow = true;
      this.scene.add(deskMatMesh);
      this.disposables.push(matGeo, merinoMat);

      // Sculpted Wireless Mouse group (elevates smoothly off the merino mat when active)
      const group = new THREE.Group();
      group.name = 'ergo-mouse';
      group.position.set(0.72, 0.009, 0.34);

      const mouseShellMat = new THREE.MeshPhysicalMaterial({
        color: '#191C22',
        roughness: 0.42,
        metalness: 0.12,
        clearcoat: 0.18,
        clearcoatRoughness: 0.52,
      });

      // Primary sculpted ergonomic mouse dome
      const shellGeo = new THREE.SphereGeometry(0.068, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.56);
      shellGeo.scale(0.88, 0.72, 1.48);
      const shellMesh = new THREE.Mesh(shellGeo, mouseShellMat);
      shellMesh.position.set(0, 0.008, 0);
      shellMesh.castShadow = true;
      shellMesh.receiveShadow = true;
      group.add(shellMesh);

      // Lower precision base chassis & subtle ergonomic thumb wing
      const thumbWingShape = new THREE.Shape();
      thumbWingShape.moveTo(-0.068, -0.04);
      thumbWingShape.quadraticCurveTo(-0.088, 0.005, -0.058, 0.068);
      thumbWingShape.lineTo(0.055, 0.065);
      thumbWingShape.quadraticCurveTo(0.062, -0.02, 0.048, -0.085);
      thumbWingShape.quadraticCurveTo(0.0, -0.102, -0.068, -0.04);

      const wingGeo = new THREE.ExtrudeGeometry(thumbWingShape, {
        depth: 0.012,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
      });
      wingGeo.rotateX(Math.PI / 2);
      const wingMesh = new THREE.Mesh(wingGeo, powderSteelMat);
      wingMesh.position.set(0, 0.015, 0.005);
      wingMesh.castShadow = true;
      group.add(wingMesh);

      // Machined stainless MagSpeed scroll wheel
      const scrollWheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.013, 0.01, 24),
        anodizedTungstenMat
      );
      scrollWheel.rotation.z = Math.PI / 2;
      scrollWheel.position.set(0, 0.047, -0.044);
      group.add(scrollWheel);

      // Thumb horizontal brass scroll roller & twin side buttons
      const thumbRoller = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.018, 16),
        brushedBrassMat
      );
      thumbRoller.rotation.x = Math.PI / 2;
      thumbRoller.position.set(-0.054, 0.027, -0.012);
      group.add(thumbRoller);

      // Refined DeskNest Emerald DPI / charge indicator slit
      const dpiLedMat = new THREE.MeshStandardMaterial({
        color: '#00C896',
        emissive: '#00C896',
        emissiveIntensity: 1.8,
        roughness: 0.2,
      });
      const dpiSlit = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, 0.018), dpiLedMat);
      dpiSlit.position.set(0, 0.052, -0.016);
      group.add(dpiSlit);

      this.registerProductRig(
        'ergo-mouse',
        group,
        [0.24, 0.09, 0.28],
        [0, 0.04, 0],
        [0.2, 0.28],
        [0, 0.16, 0.04],
        [dpiLedMat],
        1.8,
        contactShadowTex
      );
      this.disposables.push(mouseShellMat, shellGeo, wingGeo, dpiLedMat);
    }

    // =========================================================================
    // PRODUCT 5: SORA MACHINED ALUMINUM DESKTOP AUDIO DAC / ROTARY DIAL
    // =========================================================================
    {
      const group = new THREE.Group();
      group.name = 'audio-dac';
      group.position.set(-0.84, 0.002, 0.12);

      // Monolithic chamfered CNC aluminum base housing
      const dacShape = createRoundedRectShape(0.22, 0.22, 0.024);
      const dacBodyGeo = new THREE.ExtrudeGeometry(dacShape, {
        depth: 0.042,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 3,
      });
      dacBodyGeo.rotateX(Math.PI / 2);
      const dacBody = new THREE.Mesh(dacBodyGeo, darkCncAluminumMat);
      dacBody.position.set(0, 0.054, 0);
      dacBody.castShadow = true;
      dacBody.receiveShadow = true;
      group.add(dacBody);

      // Machined brass isolation feet (4 corners)
      [
        [-0.08, -0.08],
        [0.08, -0.08],
        [-0.08, 0.08],
        [0.08, 0.08],
      ].forEach(([fx, fz]) => {
        const foot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.016, 0.008, 16),
          brushedBrassMat
        );
        foot.position.set(fx, 0.004, fz);
        group.add(foot);
      });

      // Refined DeskNest Emerald perimeter base halo ring
      const dacHaloMat = new THREE.MeshStandardMaterial({
        color: '#00C896',
        emissive: '#00C896',
        emissiveIntensity: 1.45,
        roughness: 0.25,
      });
      const haloRing = new THREE.Mesh(
        new THREE.RingGeometry(0.064, 0.072, 48),
        dacHaloMat
      );
      haloRing.rotation.x = -Math.PI / 2;
      haloRing.position.set(0, 0.0615, -0.01);
      group.add(haloRing);

      // Oversized 52mm Machined Aluminum Rotary Volume Dial with knurled vertical ribs
      this.dacDialGroup = new THREE.Group();
      this.dacDialGroup.position.set(0, 0.062, -0.01);

      const dialCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.062, 0.064, 0.042, 48),
        anodizedTungstenMat
      );
      dialCore.position.y = 0.021;
      dialCore.castShadow = true;
      this.dacDialGroup.add(dialCore);

      const dialTopBevel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.062, 0.006, 48),
        anodizedTungstenMat
      );
      dialTopBevel.position.y = 0.045;
      this.dacDialGroup.add(dialTopBevel);

      // Instanced precision knurling ribs around the rotary dial
      const ribGeo = new THREE.BoxGeometry(0.0025, 0.036, 0.003);
      const ribCount = 44;
      const ribs = new THREE.InstancedMesh(ribGeo, anodizedTungstenMat, ribCount);
      const rDummy = new THREE.Object3D();
      for (let i = 0; i < ribCount; i++) {
        const theta = (i / ribCount) * Math.PI * 2;
        rDummy.position.set(Math.cos(theta) * 0.063, 0.021, Math.sin(theta) * 0.063);
        rDummy.rotation.set(0, -theta, 0);
        rDummy.updateMatrix();
        ribs.setMatrixAt(i, rDummy.matrix);
      }
      ribs.instanceMatrix.needsUpdate = true;
      ribs.computeBoundingSphere();
      this.dacDialGroup.add(ribs);

      // Warm amber position notch embedded in dial top
      const notch = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.004, 0.022), dacHaloMat);
      notch.position.set(0, 0.048, 0.036);
      this.dacDialGroup.add(notch);

      group.add(this.dacDialGroup);

      // Recessed angled front OLED micro-display showing 384kHz / -14.0 dB
      const oledMat = new THREE.MeshStandardMaterial({
        map: dacOledTex,
        emissiveMap: dacOledTex,
        emissive: '#FFFFFF',
        emissiveIntensity: 1.35,
        roughness: 0.15,
      });
      const oledPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.088, 0.034), oledMat);
      oledPlane.position.set(-0.038, 0.032, 0.117);
      group.add(oledPlane);

      // Gold-plated 6.35mm & 4.4mm balanced headphone jack rings on front face
      [
        { x: 0.044, r: 0.011 },
        { x: 0.078, r: 0.0085 },
      ].forEach(({ x, r }) => {
        const jackRing = new THREE.Mesh(
          new THREE.TorusGeometry(r, 0.0028, 12, 24),
          brushedBrassMat
        );
        jackRing.position.set(x, 0.032, 0.117);
        group.add(jackRing);

        const jackHole = new THREE.Mesh(
          new THREE.CircleGeometry(r * 0.72, 16),
          powderSteelMat
        );
        jackHole.position.set(x, 0.032, 0.1165);
        group.add(jackHole);
      });

      this.registerProductRig(
        'audio-dac',
        group,
        [0.26, 0.15, 0.26],
        [0, 0.06, 0],
        [0.3, 0.3],
        [0, 0.2, 0.06],
        [dacHaloMat, oledMat],
        1.4,
        contactShadowTex
      );
      this.disposables.push(dacBodyGeo, dacHaloMat, ribGeo, oledMat);
    }

    // =========================================================================
    // SIGNATURE BRAND PROP: Minimalist Matte-Navy Potted Desk Plant (2 Emerald Leaves)
    // =========================================================================
    this.buildSignatureDeskPlant(contactShadowTex);
  }

  private buildSignatureDeskPlant(contactShadowTex: THREE.CanvasTexture): void {
    const plantGroup = new THREE.Group();
    plantGroup.name = 'desknest-signature-plant';
    plantGroup.position.set(1.06, 0, -0.34);

    // Matte-navy minimalist tapered ceramic pot
    const potMat = new THREE.MeshStandardMaterial({
      color: '#0F2133',
      roughness: 0.72,
      metalness: 0.08,
    });
    const potGeo = new THREE.CylinderGeometry(0.06, 0.044, 0.092, 32);
    const potMesh = new THREE.Mesh(potGeo, potMat);
    potMesh.position.y = 0.046;
    potMesh.castShadow = true;
    potMesh.receiveShadow = true;
    plantGroup.add(potMesh);

    // Clean chamfered top pot rim ring
    const rimGeo = new THREE.TorusGeometry(0.058, 0.0045, 12, 32);
    const rimMesh = new THREE.Mesh(rimGeo, potMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.091;
    plantGroup.add(rimMesh);

    // Dark botanical soil recessed inside pot
    const soilMat = new THREE.MeshStandardMaterial({
      color: '#1E1A16',
      roughness: 0.96,
      metalness: 0.0,
    });
    const soilGeo = new THREE.CircleGeometry(0.054, 24);
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.rotation.x = -Math.PI / 2;
    soilMesh.position.y = 0.086;
    plantGroup.add(soilMesh);

    // Emerald stem
    const leafMat = new THREE.MeshPhysicalMaterial({
      color: '#008B6B',
      roughness: 0.36,
      metalness: 0.04,
      clearcoat: 0.22,
      clearcoatRoughness: 0.35,
    });
    const stemGeo = new THREE.CylinderGeometry(0.0045, 0.0055, 0.082, 12);
    const stemMesh = new THREE.Mesh(stemGeo, leafMat);
    stemMesh.position.y = 0.122;
    stemMesh.castShadow = true;
    plantGroup.add(stemMesh);

    // Sculpted botanical leaf geometry (symmetrical curved teardrop matching DeskNest icon)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(-0.044, 0.028, -0.048, 0.095, 0, 0.132);
    leafShape.bezierCurveTo(0.048, 0.095, 0.044, 0.028, 0, 0);

    const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
      depth: 0.0035,
      bevelEnabled: true,
      bevelThickness: 0.0018,
      bevelSize: 0.0018,
      bevelSegments: 2,
    });
    leafGeo.center();
    leafGeo.translate(0, 0.064, 0);

    const leftLeaf = new THREE.Mesh(leafGeo, leafMat);
    leftLeaf.position.set(-0.004, 0.128, 0);
    leftLeaf.rotation.set(0.18, 0.14, 0.62);
    leftLeaf.castShadow = true;
    plantGroup.add(leftLeaf);

    const rightLeaf = new THREE.Mesh(leafGeo, leafMat);
    rightLeaf.position.set(0.004, 0.128, 0);
    rightLeaf.rotation.set(-0.14, -0.14, -0.62);
    rightLeaf.castShadow = true;
    plantGroup.add(rightLeaf);

    // Grounded contact shadow beneath the ceramic pot
    const potShadowGeo = new THREE.PlaneGeometry(0.18, 0.18);
    const potShadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const potShadow = new THREE.Mesh(potShadowGeo, potShadowMat);
    potShadow.rotation.x = -Math.PI / 2;
    potShadow.position.y = 0.0018;
    plantGroup.add(potShadow);

    this.scene.add(plantGroup);
    this.disposables.push(
      potMat,
      potGeo,
      rimGeo,
      soilMat,
      soilGeo,
      leafMat,
      stemGeo,
      leafGeo,
      potShadowGeo,
      potShadowMat
    );
  }

  private registerProductRig(
    id: string,
    group: THREE.Group,
    proxySize: [number, number, number],
    proxyOffset: [number, number, number],
    shadowSize: [number, number],
    rimOffset: [number, number, number],
    accentEmissiveMaterials: THREE.MeshStandardMaterial[],
    baseEmissiveIntensity: number,
    contactShadowTex: THREE.CanvasTexture
  ): void {
    const productDef = PRODUCTS.find((p) => p.id === id)!;

    // Invisible simplified proxy bounding box for ultra-fast raycasting
    const proxyGeo = new THREE.BoxGeometry(...proxySize);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
    proxyMesh.position.set(...proxyOffset);
    proxyMesh.userData.productId = id;
    group.add(proxyMesh);
    this.proxyMeshes.push(proxyMesh);
    this.disposables.push(proxyGeo, proxyMat);

    // Grounded contact shadow plane staying anchored beneath the product
    const shadowGeo = new THREE.PlaneGeometry(shadowSize[0], shadowSize[1]);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(group.position.x, group.position.y + 0.0015, group.position.z);
    this.scene.add(contactShadow);
    this.disposables.push(shadowGeo, shadowMat);

    // Refined DeskNest Emerald active spotlight/rim PointLight when product is framed or hovered
    const rimLight = new THREE.PointLight('#00C896', 0.0, 1.5, 2.0);
    rimLight.position.set(
      group.position.x + rimOffset[0],
      group.position.y + rimOffset[1],
      group.position.z + rimOffset[2]
    );
    this.scene.add(rimLight);

    this.scene.add(group);

    this.productRigs.set(id, {
      id,
      group,
      baseY: group.position.y,
      currentElevation: 0,
      targetElevation: 0,
      contactShadow,
      rimLight,
      accentEmissiveMaterials,
      baseEmissiveIntensity,
      hotspotAnchor: new THREE.Vector3(...productDef.hotspotAnchor),
      proxyMesh,
    });
  }

  private buildAmbientDustMotes(): void {
    const count = this.isMobile ? 85 : 170;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3.4;
      positions[i * 3 + 1] = 0.08 + Math.random() * 1.65;
      positions[i * 3 + 2] = -0.9 + Math.random() * 1.9;
      scales[i] = 0.6 + Math.random() * 1.4;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.dustMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#7DE8CE') },
        uOpacity: { value: 0.36 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float aScale;
        attribute float aPhase;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.35 + aPhase) * 0.055;
          pos.x += cos(uTime * 0.24 + aPhase * 1.3) * 0.045;
          pos.z += sin(uTime * 0.2 + aPhase * 0.8) * 0.035;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aScale * 14.0 * uPixelRatio * (1.0 / max(1.0, -mvPosition.z));
          vAlpha = 0.45 + 0.55 * sin(uTime * 0.7 + aPhase * 2.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float soft = smoothstep(0.5, 0.06, dist);
          gl_FragColor = vec4(uColor, soft * vAlpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, this.dustMaterial);
    points.frustumCulled = false;
    this.scene.add(points);
    this.disposables.push(geo, this.dustMaterial);
  }

  /**
   * Smoothly transitions all lighting, background gradient, monitor light bar,
   * keyboard underglow, and dust motes between "Deep Focus Night" and "Studio Daylight".
   */
  public setAtmosphere(mode: AtmosphereMode): void {
    if (this.disposed || this.atmosphere === mode) return;
    this.atmosphere = mode;

    const isDay = mode === 'day';
    const targetBg = new THREE.Color(isDay ? '#F8FAFC' : '#08111A');
    const targetFloor = new THREE.Color(isDay ? '#EEF2F6' : '#09131E');
    const targetWall = new THREE.Color(isDay ? '#F1F5F9' : '#0B1724');
    const targetHemiSky = new THREE.Color(isDay ? '#FFFFFF' : '#7EA2C9');
    const targetHemiGround = new THREE.Color(isDay ? '#CBD5E1' : '#0E1C2B');
    const targetKeyColor = new THREE.Color(isDay ? '#FFFDF8' : '#FFF1DC');
    const targetDustColor = new THREE.Color(isDay ? '#64748B' : '#7DE8CE');

    const dur = 1.05;
    const ease = 'power2.inOut';

    gsap.to(this.bgColor, {
      r: targetBg.r,
      g: targetBg.g,
      b: targetBg.b,
      duration: dur,
      ease,
      onUpdate: () => {
        this.scene.background = this.bgColor;
        this.fog.color.copy(this.bgColor);
      },
    });

    gsap.to(this.studioFloorMat.color, {
      r: targetFloor.r,
      g: targetFloor.g,
      b: targetFloor.b,
      duration: dur,
      ease,
    });

    gsap.to(this.backWallMat.color, {
      r: targetWall.r,
      g: targetWall.g,
      b: targetWall.b,
      duration: dur,
      ease,
    });

    gsap.to(this.fog, {
      density: isDay ? 0.048 : 0.085,
      duration: dur,
      ease,
    });

    gsap.to(this.hemiLight, {
      intensity: isDay ? 1.45 : 0.42,
      duration: dur,
      ease,
    });
    gsap.to(this.hemiLight.color, {
      r: targetHemiSky.r,
      g: targetHemiSky.g,
      b: targetHemiSky.b,
      duration: dur,
      ease,
    });
    gsap.to(this.hemiLight.groundColor, {
      r: targetHemiGround.r,
      g: targetHemiGround.g,
      b: targetHemiGround.b,
      duration: dur,
      ease,
    });

    gsap.to(this.keyLight, {
      intensity: isDay ? 2.55 : 1.45,
      duration: dur,
      ease,
    });
    gsap.to(this.keyLight.color, {
      r: targetKeyColor.r,
      g: targetKeyColor.g,
      b: targetKeyColor.b,
      duration: dur,
      ease,
    });

    gsap.to(this.fillLight, {
      intensity: isDay ? 1.05 : 0.58,
      duration: dur,
      ease,
    });

    gsap.to(this.scene, {
      environmentIntensity: isDay ? 1.12 : 0.52,
      duration: dur,
      ease,
    });

    // Monitor Light Bar dims subtly in Studio Daylight, warms dramatically in Deep Focus Night
    gsap.to(this.lightBarSpot, {
      intensity: isDay ? 0.65 : 3.6,
      duration: dur,
      ease,
    });
    if (this.lightBarRect) {
      gsap.to(this.lightBarRect, {
        intensity: isDay ? 0.8 : 4.2,
        duration: dur,
        ease,
      });
    }
    gsap.to(this.lightBarEmissiveMat, {
      emissiveIntensity: isDay ? 0.65 : 3.4,
      duration: dur,
      ease,
    });

    // Keyboard amber underglow
    gsap.to(this.keyboardUnderglowMat, {
      emissiveIntensity: isDay ? 0.3 : 1.55,
      duration: dur,
      ease,
    });

    // Monitor display luminance
    gsap.to(this.monitorScreenMat, {
      emissiveIntensity: isDay ? 0.62 : 0.92,
      duration: dur,
      ease,
    });

    // Dust motes subtlety
    gsap.to(this.dustMaterial.uniforms.uOpacity, {
      value: isDay ? 0.16 : 0.42,
      duration: dur,
      ease,
    });
    gsap.to(this.dustMaterial.uniforms.uColor.value, {
      r: targetDustColor.r,
      g: targetDustColor.g,
      b: targetDustColor.b,
      duration: dur,
      ease,
    });
  }

  /**
   * Called by GSAP ScrollTrigger as the user enters Act 0 (Hero) or Acts 1..5 (Product Spotlights).
   */
  public setActiveAct(actIndex: number): void {
    this.activeActIndex = actIndex;
    const preset =
      actIndex === 0
        ? this.isMobile
          ? HERO_CAMERA_MOBILE
          : HERO_CAMERA_DESKTOP
        : this.isMobile
          ? PRODUCTS[actIndex - 1].cameraMobile
          : PRODUCTS[actIndex - 1].cameraDesktop;

    this.desiredCamPos.set(...preset.position);
    this.desiredLookAt.set(...preset.target);
    this.desiredFov = preset.fov ?? 36;

    // Trigger "exploded elevation" float on the active spotlighted product
    const activeProductId = actIndex > 0 ? PRODUCTS[actIndex - 1]?.id : null;
    this.productRigs.forEach((rig) => {
      const isFocused = rig.id === activeProductId;
      rig.targetElevation = isFocused ? (rig.id === 'ultrawide-monitor' ? 0.085 : 0.115) : 0;
    });
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    this.isMobile = window.innerWidth <= 768;
    const dprCap = this.isSoftwareGl ? 1 : this.isMobile ? 1.5 : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(dprCap);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.dustMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    this.setActiveAct(this.activeActIndex);
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    this.pointerNormalized.set(nx, ny);
    this.pointerNdc.set(nx, ny);

    // Throttle raycasting to ~24Hz for silky performance
    const now = performance.now();
    if (now - this.lastRaycastTime < 42) return;
    this.lastRaycastTime = now;

    // Only raycast when cursor isn't hovering over UI cards/drawers
    const targetEl = e.target as HTMLElement | null;
    if (targetEl && targetEl.closest('[data-ui-interactive="true"]')) {
      if (this.hoveredProductId !== null) {
        this.hoveredProductId = null;
        this.callbacks.onProductHover?.(null);
      }
      return;
    }

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.proxyMeshes, false);
    const hitId = hits.length > 0 ? (hits[0].object.userData.productId as string) : null;

    if (hitId !== this.hoveredProductId) {
      this.hoveredProductId = hitId;
      this.callbacks.onProductHover?.(hitId);
    }
  };

  private handlePointerDown = (e: PointerEvent): void => {
    this.pointerDownPos.set(e.clientX, e.clientY);
  };

  private handlePointerUp = (e: PointerEvent): void => {
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 8) return; // Ignore scroll/drag gestures

    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    this.pointerNdc.set(nx, ny);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.proxyMeshes, false);
    if (hits.length > 0) {
      const hitId = hits[0].object.userData.productId as string;
      this.callbacks.onProductClick?.(hitId);
    }
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.callbacks.onWebGLError?.('WebGL rendering context was interrupted.');
  };

  private handleContextRestored = (): void => {
    if (!this.disposed) {
      this.startLoop();
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  private startLoop(): void {
    this.clock.start();
    const tick = () => {
      if (this.disposed) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();

      this.updateFrame(dt, elapsed);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };
    tick();
  }

  private updateFrame(dt: number, elapsed: number): void {
    // Update dust shader uniform
    this.dustMaterial.uniforms.uTime.value = elapsed;

    // Gentle parallax drift stronger in Hero Act 0, tighter during product inspections & mobile
    const parallaxStrength = this.isMobile
      ? 0.04
      : this.activeActIndex === 0
        ? 0.24
        : 0.085;
    this._parallaxPos.set(
      this.desiredCamPos.x + this.pointerNormalized.x * parallaxStrength,
      this.desiredCamPos.y + this.pointerNormalized.y * (parallaxStrength * 0.55),
      this.desiredCamPos.z
    );

    // Frame-rate independent exponential damping
    const camLambda = 4.6;
    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      this._parallaxPos.x,
      camLambda,
      dt
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      this._parallaxPos.y,
      camLambda,
      dt
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      this._parallaxPos.z,
      camLambda,
      dt
    );

    this.currentLookAt.x = THREE.MathUtils.damp(
      this.currentLookAt.x,
      this.desiredLookAt.x,
      camLambda,
      dt
    );
    this.currentLookAt.y = THREE.MathUtils.damp(
      this.currentLookAt.y,
      this.desiredLookAt.y,
      camLambda,
      dt
    );
    this.currentLookAt.z = THREE.MathUtils.damp(
      this.currentLookAt.z,
      this.desiredLookAt.z,
      camLambda,
      dt
    );

    if (Math.abs(this.camera.fov - this.desiredFov) > 0.02) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.desiredFov, 4.2, dt);
      this.camera.updateProjectionMatrix();
    }

    this._tempLook.copy(this.currentLookAt);
    this.camera.lookAt(this._tempLook);

    // Subtle mechanical motion on the Sora Audio DAC rotary dial when focused or hovered
    if (this.dacDialGroup) {
      const dacActive =
        this.activeActIndex === 5 || this.hoveredProductId === 'audio-dac';
      const targetRot = dacActive ? Math.sin(elapsed * 0.9) * 0.45 : 0.35;
      this.dacDialGroup.rotation.y = THREE.MathUtils.damp(
        this.dacDialGroup.rotation.y,
        targetRot,
        3.5,
        dt
      );
    }

    // Exploded elevation animation + warm 2700K rim light per product
    const activeProductId =
      this.activeActIndex > 0 ? PRODUCTS[this.activeActIndex - 1]?.id : null;

    this.productRigs.forEach((rig) => {
      const isHovered = this.hoveredProductId === rig.id;
      const isActive = activeProductId === rig.id;

      const hoverBoost = isHovered ? 0.032 : 0;
      const breathe = isActive ? Math.sin(elapsed * 1.9) * 0.008 : 0;
      const targetY = rig.targetElevation + hoverBoost + breathe;

      rig.currentElevation = THREE.MathUtils.damp(rig.currentElevation, targetY, 5.2, dt);
      rig.group.position.y = rig.baseY + rig.currentElevation;

      // Subtle presentation pitch when floated
      const targetTilt = isActive && rig.id !== 'ultrawide-monitor' ? 0.045 : 0;
      rig.group.rotation.x = THREE.MathUtils.damp(rig.group.rotation.x, targetTilt, 4.8, dt);

      // Soften and slightly expand contact shadow as object elevates
      const shadowMat = rig.contactShadow.material as THREE.MeshBasicMaterial;
      const elevationRatio = Math.min(1, rig.currentElevation / 0.14);
      shadowMat.opacity = THREE.MathUtils.lerp(0.5, 0.24, elevationRatio);
      const shadowScale = 1 + elevationRatio * 0.14;
      rig.contactShadow.scale.set(shadowScale, shadowScale, 1);

      // Warm amber rim light intensity bloom when active or hovered
      const targetRim = isActive
        ? this.atmosphere === 'day'
          ? 0.55
          : 1.55
        : isHovered
          ? 0.75
          : 0.0;
      rig.rimLight.intensity = THREE.MathUtils.damp(rig.rimLight.intensity, targetRim, 5.5, dt);
    });

    // Project 3D hotspot pins to 2D viewport coordinates (zero-allocation loop)
    if (this.callbacks.onHotspotsProject) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let idx = 0;

      for (const product of PRODUCTS) {
        const rig = this.productRigs.get(product.id);
        const out = this._hotspotResults[idx++];
        if (!rig) {
          out.visible = false;
          continue;
        }
        this._projVec.copy(rig.hotspotAnchor);
        this._projVec.y += rig.currentElevation;
        this._projVec.project(this.camera);

        const inFront = this._projVec.z < 1 && this._projVec.z > -1;
        out.x = (this._projVec.x * 0.5 + 0.5) * width;
        out.y = (-this._projVec.y * 0.5 + 0.5) * height;
        const bottomCutoff = this.isMobile ? height * 0.52 : height - 104;
        out.visible =
          inFront &&
          out.x > 24 &&
          out.x < width - 24 &&
          out.y > 64 &&
          out.y < bottomCutoff;
      }

      this.callbacks.onHotspotsProject(this._hotspotResults);
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointermove', this.handlePointerMove);

    if (this.renderer) {
      const canvas = this.renderer.domElement;
      canvas.removeEventListener('pointerdown', this.handlePointerDown);
      canvas.removeEventListener('pointerup', this.handlePointerUp);
      canvas.removeEventListener('webglcontextlost', this.handleContextLost);
      canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
      if (canvas.parentElement === this.container) {
        this.container.removeChild(canvas);
      }
      this.renderer.dispose();
    }

    this.disposables.forEach((d) => {
      try {
        d.dispose();
      } catch {
        // Ignore already-disposed resources
      }
    });
    this.disposables = [];
  }
}
