/**
 * DeskNest — Curated Hardware Catalog & 3D Camera Framing Specification
 *
 * Replace `affiliateUrl` values with your live partner tracking links.
 * Every URL carries structured UTM parameters for attribution clarity.
 */

export interface ProductSpec {
  label: string;
  value: string;
}

export interface HonestVerdict {
  summary: string;
  bestFor: string[];
  skipIf: string[];
}

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface DeskProduct {
  id: string;
  index: string;
  shortNavLabel: string;
  name: string;
  category: string;
  tagline: string;
  tactileHook: string;
  frictionRemoved: string;
  honestVerdict: HonestVerdict;
  specs: [ProductSpec, ProductSpec, ProductSpec];
  price: number;
  priceFormatted: string;
  merchant: string;
  affiliateUrl: string;
  dimensions: string;
  coordinates: string;
  alignment: 'left' | 'right';
  hotspotAnchor: [number, number, number];
  cameraDesktop: CameraPreset;
  cameraMobile: CameraPreset;
}

export const HERO_CAMERA_DESKTOP: CameraPreset = {
  position: [0.0, 2.35, 4.35],
  target: [0.0, 0.42, -0.15],
  fov: 38,
};

export const HERO_CAMERA_MOBILE: CameraPreset = {
  position: [0.0, 2.55, 6.4],
  target: [0.0, -0.88, -0.15],
  fov: 58,
};

export const PRODUCTS: DeskProduct[] = [
  {
    id: 'walnut-shelf',
    index: '01',
    shortNavLabel: 'Desk Shelf',
    name: 'Kuroda Walnut & Steel Desk Shelf',
    category: 'Spatial Architecture',
    tagline: 'Hand-oiled American black walnut suspended over folded powder-coated steel.',
    tactileHook:
      'Run a palm along the 24mm chamfered front edge and you feel satin tung-oil grain warmed to room temperature—anchored by 4mm dead-flat folded steel legs that refuse to shudder even under heavy monitor arms.',
    frictionRemoved:
      'Eliminates desktop visual scatter by creating a dedicated lower bay for notebooks, docks, and cables while lifting eye-level posture without cramping your typing zone.',
    honestVerdict: {
      summary:
        'An architectural foundation piece that turns a flat table into a tiered studio instrument.',
      bestFor: [
        'Dual-tier setups needing hidden space for Thunderbolt hubs and sketchbooks',
        'Designers pairing warm organic timber with dark anodized aluminum gear',
        'Long desks (140cm+) where a crisp horizontal datum line grounds the room',
      ],
      skipIf: [
        'Your desk depth is under 60cm and you sit very close to your display',
        'You prefer monitor clamp arms mounted directly at the center-rear edge without spacers',
      ],
    },
    specs: [
      { label: 'Timber Slab', value: 'Solid 24mm FAS Black Walnut' },
      { label: 'Chassis', value: '4mm Folded Steel · Matte Obsidian' },
      { label: 'Load Capacity', value: '45 kg Static · Integrated Tray' },
    ],
    price: 290,
    priceFormatted: '$290',
    merchant: 'Grovemade Direct',
    affiliateUrl:
      'https://desknest.example.com/go/walnut-shelf?utm_source=desknest&utm_medium=3d_showcase&utm_campaign=desk_2026&ref=dn_01',
    dimensions: '1160 × 230 × 108 mm',
    coordinates: 'X 0.00 · Y 0.14 · Z -0.58',
    alignment: 'left',
    hotspotAnchor: [0.42, 0.24, -0.55],
    cameraDesktop: {
      position: [-1.15, 0.92, 1.55],
      target: [0.35, 0.22, -0.55],
      fov: 35,
    },
    cameraMobile: {
      position: [0.0, 1.32, 2.85],
      target: [0.0, -0.62, -0.55],
      fov: 56,
    },
  },
  {
    id: 'ultrawide-monitor',
    index: '02',
    shortNavLabel: 'Monitor & Light',
    name: 'Aether 38" Curved Display + Halo Bar',
    category: 'Optical Canvas & Illumination',
    tagline: '2300R cinema-grade ultrawide paired with an asymmetric 2700K desk beam.',
    tactileHook:
      'The CNC-weighted tungsten light bar rests with zero clamp pressure on the razor-thin bezel, casting an asymmetric 2700K pool exclusively across your keyboard and notebook while keeping the matte IPS Black glass reflection-free.',
    frictionRemoved:
      'Replaces dual-monitor bezel splits and harsh overhead ceiling glare with one unbroken panoramic field and calibrated nocturnal desk illumination.',
    honestVerdict: {
      summary:
        'Unmatched horizontal workflow clarity paired with eye-saving nocturnal warmth.',
      bestFor: [
        'Creative technologists juggling timeline editors, CAD viewports, and code side-by-side',
        'Late-night builders who want warm 2700K desk pool lighting without screen washout',
        'Single-cable USB-C 96W workstation simplicity',
      ],
      skipIf: [
        'You require 240Hz OLED esports response times over color-accurate IPS text clarity',
        'Your desk cannot accommodate a 90cm panoramic wingspan',
      ],
    },
    specs: [
      { label: 'Panel', value: '38" 3840×1600 IPS Black · 2300R' },
      { label: 'Light Bar', value: 'Asymmetric 2700K–6500K · CRI 97+' },
      { label: 'Connectivity', value: 'Thunderbolt 4 · 96W PD Hub' },
    ],
    price: 1480,
    priceFormatted: '$1,480',
    merchant: 'B&H Pro Studio',
    affiliateUrl:
      'https://desknest.example.com/go/ultrawide-monitor?utm_source=desknest&utm_medium=3d_showcase&utm_campaign=desk_2026&ref=dn_02',
    dimensions: '894 × 565 × 245 mm',
    coordinates: 'X 0.00 · Y 0.88 · Z -0.68',
    alignment: 'right',
    hotspotAnchor: [-0.45, 1.05, -0.55],
    cameraDesktop: {
      position: [1.35, 1.18, 1.85],
      target: [-0.28, 0.84, -0.58],
      fov: 37,
    },
    cameraMobile: {
      position: [0.0, 1.52, 3.15],
      target: [0.0, -0.12, -0.58],
      fov: 56,
    },
  },
  {
    id: 'cnc-keyboard',
    index: '03',
    shortNavLabel: 'Keyboard',
    name: 'Monolith 75% CNC Mechanical Keyboard',
    category: 'Tactile Input',
    tagline: '2.1 kg bead-blasted 6063 aluminum chassis with gasket-mounted linear acoustics.',
    tactileHook:
      'Every keystroke lands with a muted, low-pitched marbly resonance rather than hollow plastic clatter—framed by a chamfered tungsten bezel, brass counter-weight, and refined emerald perimeter underglow.',
    frictionRemoved:
      'Eliminates hand travel strain and cheap switch ping while keeping dedicated arrow keys, function row, and a knurled aluminum encoder within effortless reach.',
    honestVerdict: {
      summary:
        'Heirloom-grade mechanical typing feel that makes eight hours of writing or coding quietly addictive.',
      bestFor: [
        'Engineers and writers who value dense acoustic feedback and QMK/VIA programmability',
        'Minimalist desks where a 75% footprint leaves generous mouse sweep room',
        'Tactile perfectionists who hate hollow case ping',
      ],
      skipIf: [
        'You travel daily with your keyboard—at 2.1 kg, this stays rooted to the studio',
        'You depend on a built-in numeric keypad for heavy financial modeling',
      ],
    },
    specs: [
      { label: 'Enclosure', value: 'CNC 6063 Aluminum · Brass Weight' },
      { label: 'Mounting', value: 'Poron Gasket · Hot-Swap PCB' },
      { label: 'Acoustics', value: 'Factory Lubed Linear · PBT Caps' },
    ],
    price: 385,
    priceFormatted: '$385',
    merchant: 'Mode & DeskNest Partner',
    affiliateUrl:
      'https://desknest.example.com/go/cnc-keyboard?utm_source=desknest&utm_medium=3d_showcase&utm_campaign=desk_2026&ref=dn_03',
    dimensions: '324 × 138 × 31 mm',
    coordinates: 'X -0.06 · Y 0.06 · Z 0.34',
    alignment: 'left',
    hotspotAnchor: [-0.05, 0.14, 0.32],
    cameraDesktop: {
      position: [-0.88, 0.88, 1.38],
      target: [0.16, 0.06, 0.32],
      fov: 32,
    },
    cameraMobile: {
      position: [-0.08, 1.18, 2.15],
      target: [-0.08, -0.38, 0.32],
      fov: 56,
    },
  },
  {
    id: 'ergo-mouse',
    index: '04',
    shortNavLabel: 'Mouse & Mat',
    name: 'Forma Wireless Mouse + Merino Mat',
    category: 'Precision Navigation',
    tagline: 'Sculpted low-fatigue contour gliding over 3mm German merino wool felt.',
    tactileHook:
      'Magnetic electromagnetic scrolling shifts seamlessly from crisp ratcheted detents to frictionless free-spin, while the soft matte shell glides over natural merino wool that warms your forearms on cold mornings.',
    frictionRemoved:
      'Ends wrist pronation fatigue during marathon editing sessions and replaces sticky rubber mousepads with breathable architectural wool.',
    honestVerdict: {
      summary:
        'An effortless ergonomic pairing that elevates both micro-pixel precision and desk warmth.',
      bestFor: [
        'Figma, Blender, and timeline scrubbing where free-spin scroll saves thousands of flicks',
        'Multi-machine workflows switching smoothly across three paired Bluetooth/bolt hosts',
        'Cold glass or laminate desktops needing acoustic dampening and forearm warmth',
      ],
      skipIf: [
        'You play competitive twitch FPS games requiring an ultralight <55g honeycomb shell',
        'You frequently eat or spill liquids directly over your desk surface',
      ],
    },
    specs: [
      { label: 'Sensor & Wheel', value: '8,000 DPI Optical · MagSpeed Steel' },
      { label: 'Desk Surface', value: '900×400mm 3mm Merino Wool Felt' },
      { label: 'Endurance', value: '70-Day USB-C Fast Charge' },
    ],
    price: 215,
    priceFormatted: '$215',
    merchant: 'Logitech Pro & Grovemade',
    affiliateUrl:
      'https://desknest.example.com/go/ergo-mouse?utm_source=desknest&utm_medium=3d_showcase&utm_campaign=desk_2026&ref=dn_04',
    dimensions: '125 × 84 × 51 mm + 900 mm Mat',
    coordinates: 'X 0.72 · Y 0.06 · Z 0.36',
    alignment: 'right',
    hotspotAnchor: [0.72, 0.14, 0.36],
    cameraDesktop: {
      position: [1.55, 0.82, 1.32],
      target: [0.48, 0.06, 0.34],
      fov: 31,
    },
    cameraMobile: {
      position: [0.72, 1.02, 1.92],
      target: [0.72, -0.3, 0.34],
      fov: 56,
    },
  },
  {
    id: 'audio-dac',
    index: '05',
    shortNavLabel: 'Audio DAC',
    name: 'Sora Machined Desktop Audio DAC',
    category: 'Acoustic Control',
    tagline: 'Solid-billet rotary volume attenuator driving studio headphones and monitors.',
    tactileHook:
      'Grip the 52mm diamond-knurled aluminum dial and feel hydraulic-smooth weighted resistance—no plastic wobble, just instant zero-latency analog gain control with an emerald OLED dB readout.',
    frictionRemoved:
      'Removes software volume-slider hunting and noisy motherboard audio hiss, letting you mute calls or swell studio monitors with one blind reach.',
    honestVerdict: {
      summary:
        'The single most gratifying physical control on the desk—equal parts audiophile amp and sculptural dial.',
      bestFor: [
        'Studio headphone owners (HD650, Sundara, Focal) needing clean balanced amplification',
        'Creators toggling instantly between desk monitors and open-back headphones',
        'Anyone who craves a dedicated weighted hardware volume wheel',
      ],
      skipIf: [
        'You exclusively use wireless AirPods or Bluetooth headphones at your desk',
        'You need XLR phantom-power microphone preamps (this is playback-focused)',
      ],
    },
    specs: [
      { label: 'Conversion', value: 'Dual ESS Sabre · 32-bit / 384kHz' },
      { label: 'Output Stage', value: '4.4mm Balanced + 6.35mm · 2.4W' },
      { label: 'Control', value: '52mm Knurled Billet Rotary Dial' },
    ],
    price: 365,
    priceFormatted: '$365',
    merchant: 'Apos Audio Studio',
    affiliateUrl:
      'https://desknest.example.com/go/audio-dac?utm_source=desknest&utm_medium=3d_showcase&utm_campaign=desk_2026&ref=dn_05',
    dimensions: '118 × 118 × 54 mm',
    coordinates: 'X -0.84 · Y 0.08 · Z 0.14',
    alignment: 'left',
    hotspotAnchor: [-0.84, 0.18, 0.14],
    cameraDesktop: {
      position: [-1.52, 0.72, 1.08],
      target: [-0.62, 0.08, 0.14],
      fov: 30,
    },
    cameraMobile: {
      position: [-0.84, 0.98, 1.68],
      target: [-0.84, -0.26, 0.14],
      fov: 56,
    },
  },
];

export const FULL_SETUP_TOTAL = PRODUCTS.reduce((sum, p) => sum + p.price, 0);
