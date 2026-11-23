import * as THREE from 'three';

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

/**
 * Generates an organic American Black Walnut albedo + bump texture pair.
 */
export function createWalnutTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 1024;
  const h = 512;
  const [albedoCanvas, ctx] = createCanvas(w, h);
  const [bumpCanvas, bCtx] = createCanvas(w, h);

  // Rich American Black Walnut base gradient
  const baseGrad = ctx.createLinearGradient(0, 0, w, h);
  baseGrad.addColorStop(0, '#5B3A21');
  baseGrad.addColorStop(0.32, '#6E4627');
  baseGrad.addColorStop(0.68, '#53331C');
  baseGrad.addColorStop(1, '#684124');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  // Cathedral wood grain bands
  for (let i = 0; i < 160; i++) {
    const yBase = (i / 160) * h;
    const isDark = i % 3 === 0;
    const alpha = isDark ? 0.14 + (i % 5) * 0.025 : 0.08 + (i % 4) * 0.02;
    ctx.strokeStyle = isDark
      ? `rgba(38, 21, 10, ${alpha})`
      : `rgba(148, 99, 58, ${alpha})`;
    ctx.lineWidth = 1.2 + (i % 4) * 1.1;

    bCtx.strokeStyle = isDark
      ? `rgba(60, 60, 60, ${alpha * 1.4})`
      : `rgba(175, 175, 175, ${alpha})`;
    bCtx.lineWidth = ctx.lineWidth;

    const amp = 6 + Math.sin(i * 0.23) * 14;
    const freq = 0.0045 + (i % 7) * 0.0006;
    const phase = i * 0.35;

    ctx.beginPath();
    bCtx.beginPath();
    for (let x = 0; x <= w; x += 24) {
      const wave =
        Math.sin(x * freq + phase) * amp +
        Math.cos(x * freq * 2.1 - phase * 0.6) * (amp * 0.28);
      const y = yBase + wave;
      if (x === 0) {
        ctx.moveTo(x, y);
        bCtx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
        bCtx.lineTo(x, y);
      }
    }
    ctx.stroke();
    bCtx.stroke();
  }

  // Subtle fine wood pores
  for (let p = 0; p < 1600; p++) {
    const px = ((p * 733) % w);
    const py = ((p * 419) % h);
    const plen = 8 + (p % 18);
    ctx.fillStyle = 'rgba(28, 15, 7, 0.16)';
    ctx.fillRect(px, py, plen, 1);
    bCtx.fillStyle = 'rgba(42, 42, 42, 0.35)';
    bCtx.fillRect(px, py, plen, 1);
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

/**
 * Generates directional micro-brushed anodized aluminum textures.
 */
export function createBrushedMetalTextures(
  baseHex: string,
  maxAnisotropy: number
): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 512;
  const [canvas, ctx] = createCanvas(w, h);
  const [rCanvas, rCtx] = createCanvas(w, h);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, w, h);

  rCtx.fillStyle = '#525252';
  rCtx.fillRect(0, 0, w, h);

  for (let y = 0; y < h; y++) {
    const n = Math.sin(y * 12.9898) * 43758.5453;
    const frac = n - Math.floor(n);
    const bright = frac > 0.5;
    ctx.fillStyle = bright
      ? `rgba(255, 255, 255, ${0.018 + (frac - 0.5) * 0.045})`
      : `rgba(0, 0, 0, ${0.02 + frac * 0.04})`;
    ctx.fillRect(0, y, w, 1);

    const rVal = Math.floor(68 + frac * 48);
    rCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
    rCtx.fillRect(0, y, w, 1);
  }

  // Subtle horizontal streaks
  for (let i = 0; i < 420; i++) {
    const sx = (i * 197) % w;
    const sy = (i * 313) % h;
    const sw = 40 + (i % 140);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.035)';
    ctx.fillRect(sx, sy, sw, 1);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.anisotropy = maxAnisotropy;

  return { map, roughnessMap };
}

/**
 * Generates a woven charcoal Merino Wool felt desk mat texture.
 */
export function createMerinoFeltTextures(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 512;
  const [canvas, ctx] = createCanvas(w, h);
  const [bCanvas, bCtx] = createCanvas(w, h);

  ctx.fillStyle = '#25272C';
  ctx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  // Fine merino heather fibers
  for (let i = 0; i < 14000; i++) {
    const x = (i * 131 + (i % 17) * 29) % w;
    const y = (i * 257 + (i % 23) * 19) % h;
    const angle = ((i * 73) % 360) * (Math.PI / 180);
    const len = 3 + (i % 6);
    const tone = i % 5;

    ctx.strokeStyle =
      tone === 0
        ? 'rgba(135, 140, 150, 0.16)'
        : tone === 1
          ? 'rgba(18, 20, 24, 0.25)'
          : tone === 2
            ? 'rgba(85, 89, 98, 0.18)'
            : 'rgba(54, 57, 64, 0.22)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();

    const bv = tone === 0 ? 185 : tone === 1 ? 65 : 130;
    bCtx.strokeStyle = `rgba(${bv},${bv},${bv},0.35)`;
    bCtx.lineWidth = 1;
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    bCtx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 1.5);
  map.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.colorSpace = THREE.NoColorSpace;
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 1.5);
  bumpMap.anisotropy = maxAnisotropy;

  return { map, bumpMap };
}

/**
 * Generates an architectural dark creative workstation screen canvas for the curved 38" monitor.
 */
export function createMonitorScreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1536;
  const h = 640;
  const [canvas, ctx] = createCanvas(w, h);

  // Deep Midnight Navy UI backdrop
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#08111A');
  bg.addColorStop(0.55, '#0F2133');
  bg.addColorStop(1, '#08111A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle architectural drafting grid in central viewport
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 280; x < 1180; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, 450);
    ctx.stroke();
  }
  for (let y = 60; y < 450; y += 48) {
    ctx.beginPath();
    ctx.moveTo(280, y);
    ctx.lineTo(1180, y);
    ctx.stroke();
  }

  // Top bar
  ctx.fillStyle = 'rgba(15, 33, 51, 0.95)';
  ctx.fillRect(0, 0, w, 40);
  ctx.fillStyle = 'rgba(0, 200, 150, 0.2)';
  ctx.fillRect(0, 40, w, 1);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 13px monospace';
  ctx.fillText('DESKNEST STUDIO // WORKSPACE', 26, 25);
  ctx.fillStyle = '#00C896';
  ctx.fillText('EMERALD CALIBRATED', w - 190, 25);

  // Left Inspector Column
  ctx.fillStyle = 'rgba(11, 24, 38, 0.94)';
  ctx.fillRect(0, 41, 260, h - 41);
  ctx.fillStyle = 'rgba(0, 200, 150, 0.14)';
  ctx.fillRect(260, 41, 1, h - 41);

  ctx.fillStyle = '#7C8390';
  ctx.font = '500 11px monospace';
  const layers = [
    '01  WALNUT_SLAB_24MM',
    '02  AETHER_CURVE_2300R',
    '03  MONOLITH_CNC_75',
    '04  FORMA_ERGONOMICS',
    '05  SORA_DAC_ROTARY',
  ];
  layers.forEach((label, idx) => {
    const y = 92 + idx * 42;
    if (idx === 1) {
      ctx.fillStyle = 'rgba(0, 200, 150, 0.16)';
      ctx.fillRect(16, y - 18, 228, 30);
      ctx.fillStyle = '#00C896';
    } else {
      ctx.fillStyle = '#94A3B8';
    }
    ctx.fillText(label, 28, y);
  });

  // Central isometric wireframe & DeskNest emerald contour rings
  ctx.save();
  ctx.translate(730, 255);
  for (let r = 0; r < 5; r++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 190 - r * 28, 72 - r * 11, -0.12, 0, Math.PI * 2);
    ctx.strokeStyle =
      r === 0 ? 'rgba(0, 200, 150, 0.78)' : `rgba(148, 163, 184, ${0.28 - r * 0.04})`;
    ctx.lineWidth = r === 0 ? 2 : 1;
    ctx.stroke();
  }

  // Soft emerald ambient glow at center of monitor viewport
  const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 210);
  glow.addColorStop(0, 'rgba(0, 200, 150, 0.18)');
  glow.addColorStop(0.55, 'rgba(0, 139, 107, 0.08)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-260, -160, 520, 320);
  ctx.restore();

  // Right Telemetry / Color Grading Panel
  ctx.fillStyle = 'rgba(11, 24, 38, 0.94)';
  ctx.fillRect(1200, 41, w - 1200, h - 41);
  ctx.fillStyle = 'rgba(0, 200, 150, 0.14)';
  ctx.fillRect(1200, 41, 1, h - 41);

  // Audio / Luminance curve graph in right sidebar
  ctx.strokeStyle = '#00C896';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < 270; x += 6) {
    const px = 1230 + x;
    const py = 180 - Math.sin(x * 0.032) * 38 - Math.cos(x * 0.07) * 16;
    if (x === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Bottom timeline bar
  ctx.fillStyle = 'rgba(10, 20, 32, 0.96)';
  ctx.fillRect(261, 468, 938, h - 468);
  ctx.fillStyle = 'rgba(0, 200, 150, 0.15)';
  ctx.fillRect(261, 468, 938, 1);

  // Timeline audio/keyframe tracks
  const trackColors = [
    'rgba(0, 200, 150, 0.45)',
    'rgba(148, 163, 184, 0.25)',
    'rgba(0, 139, 107, 0.48)',
  ];
  trackColors.forEach((col, i) => {
    const ty = 502 + i * 38;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(290, ty, 880, 22);
    ctx.fillStyle = col;
    ctx.fillRect(320 + i * 90, ty + 3, 280 + i * 65, 16);
    ctx.fillRect(740 - i * 40, ty + 3, 190, 16);
  });

  // Emerald playhead
  ctx.fillStyle = '#00C896';
  ctx.fillRect(680, 470, 2, 160);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Generates crisp OLED display texture for the Sora Audio DAC.
 */
export function createDacOledTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const [canvas, ctx] = createCanvas(w, h);

  ctx.fillStyle = '#060E17';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(0, 200, 150, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 18px monospace';
  ctx.fillText('PCM 384kHz', 22, 40);

  ctx.fillStyle = '#00C896';
  ctx.font = '700 42px monospace';
  ctx.fillText('-14.0 dB', 20, 96);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * Generates a soft radial alpha shadow map for grounded contact shadow planes.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size, size);
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.52, 'rgba(0, 0, 0, 0.34)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
