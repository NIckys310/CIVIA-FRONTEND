// Kit de escena arquitectónica: materiales, edificios inspirados en renders reales, calle, árboles,
// autos y personas. Unidades en metros, eje Y hacia arriba y fachada principal mirando a +Z.
import { mergeGeometries, mergeVertices } from '/vendor/three/addons/utils/BufferGeometryUtils.js';

/** Generador pseudoaleatorio con semilla: la misma escena siempre se ve igual. */
export function seeded(seed = 7) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function grainTexture(THREE, base, lines, alpha = 0.18) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = `${lines}${alpha})`;
    g.lineWidth = 0.6 + Math.random() * 1.8;
    const x = Math.random() * 256;
    g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 4, 90, x - 4, 170, x + 2, 256); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function noiseTexture(THREE, size, paint, repeat) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  paint(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(repeat, repeat);
  return t;
}

function speckle(g, size, base, tones, count, min = 1, max = 3) {
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    g.fillStyle = tones[i % tones.length];
    const w = min + Math.random() * (max - min);
    g.fillRect(Math.random() * size, Math.random() * size, w, w);
  }
}

/** Materiales compartidos. setGlow(g) ajusta las ventanas encendidas según la hora. */
export function kitMaterials(THREE) {
  const std = (color, roughness = 0.85, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const wood = grainTexture(THREE, '#9a5a34', 'rgba(60,30,12,');
  wood.repeat.set(1, 1);
  const grassMap = noiseTexture(THREE, 512, (g, n) => {
    speckle(g, n, '#4b6f37', ['rgba(88,124,58,.55)', 'rgba(52,82,38,.6)', 'rgba(110,140,70,.35)', 'rgba(40,64,30,.5)'], 26000, 1, 3);
  }, 90);
  const asphaltMap = noiseTexture(THREE, 512, (g, n) => {
    speckle(g, n, '#33363b', ['rgba(80,82,86,.5)', 'rgba(20,21,24,.6)', 'rgba(120,120,118,.25)'], 30000, 1, 2);
  }, 30);
  const paverMap = noiseTexture(THREE, 512, (g, n) => {
    speckle(g, n, '#9d9a92', ['rgba(120,116,108,.5)', 'rgba(170,166,158,.4)'], 9000, 1, 3);
    g.strokeStyle = 'rgba(60,58,54,.55)';
    g.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { const v = (i * n) / 8; g.beginPath(); g.moveTo(v, 0); g.lineTo(v, n); g.moveTo(0, v); g.lineTo(n, v); g.stroke(); }
  }, 18);
  // Las cajas llevan coordenadas UV en metros (ver box()): repeat = 1 / metros que cubre la textura.
  const concreteMap = noiseTexture(THREE, 512, (g, n) => {
    speckle(g, n, '#bdb9b1', ['rgba(150,146,140,.30)', 'rgba(210,206,198,.30)', 'rgba(120,116,110,.22)'], 26000, 1, 3);
    // Juntas de encofrado y manchas suaves de intemperie.
    g.strokeStyle = 'rgba(90,88,84,.22)';
    g.lineWidth = 2;
    for (let i = 0; i <= 2; i++) { const v = (i * n) / 2; g.beginPath(); g.moveTo(0, v); g.lineTo(n, v); g.stroke(); }
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * n; const grd = g.createLinearGradient(x, 0, x, n);
      grd.addColorStop(0, 'rgba(70,66,60,.10)'); grd.addColorStop(1, 'rgba(70,66,60,0)');
      g.fillStyle = grd; g.fillRect(x, 0, 6 + Math.random() * 18, n);
    }
  }, 1 / 4);
  const brickMap = noiseTexture(THREE, 512, (g, n) => {
    g.fillStyle = '#b9b2a6'; g.fillRect(0, 0, n, n); // mortero
    const rows = 32; const bh = n / rows; const bw = n / 8;
    const tones = ['#8c4a36', '#97523b', '#7d4231', '#a05c43', '#874634', '#6f3a2c'];
    for (let j = 0; j < rows; j++) for (let i = -1; i < 9; i++) {
      g.fillStyle = tones[Math.floor(Math.random() * tones.length)];
      g.fillRect(i * bw + (j % 2) * bw / 2 + 1.5, j * bh + 1.5, bw - 3, bh - 3);
    }
  }, 1 / 2.2);
  const stoneMap = noiseTexture(THREE, 512, (g, n) => {
    speckle(g, n, '#d6cdbd', ['rgba(190,180,164,.45)', 'rgba(228,222,210,.4)', 'rgba(160,150,136,.25)'], 22000, 1, 3);
    g.strokeStyle = 'rgba(120,112,100,.45)'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { const v = (i * n) / 4; g.beginPath(); g.moveTo(0, v); g.lineTo(n, v); g.stroke(); }
    for (let j = 0; j < 4; j++) for (let i = 0; i <= 2; i++) { const x = ((i + (j % 2) * 0.5) * n) / 2; g.beginPath(); g.moveTo(x, (j * n) / 4); g.lineTo(x, ((j + 1) * n) / 4); g.stroke(); }
  }, 1 / 3);
  const lit = [
    std(0x2e261d, 0.9, 0, { emissive: 0xffc480, emissiveIntensity: 1 }),
    std(0x2b261f, 0.9, 0, { emissive: 0xffe1b3, emissiveIntensity: 1 }),
    std(0x24221f, 0.9, 0, { emissive: 0xffb466, emissiveIntensity: 1 }),
  ];
  const lamps = std(0xfff3d6, 0.4, 0, { emissive: 0xffdca8, emissiveIntensity: 1 });
  // Vidrio arquitectónico con capa de control solar: refleja ~25-35 % del cielo real (más en ángulo
  // rasante) y deja ver un interior oscuro, como los muros cortina de las fotos.
  const glassOpts = { color: 0x7d8fa0, roughness: 0.05, metalness: 0.55, ior: 1.5, envMapIntensity: 1.0, clearcoat: 1, clearcoatRoughness: 0.02 };
  const facadeGlass = new THREE.MeshPhysicalMaterial({ ...glassOpts });
  const litGlass = [0xffc98e, 0xffe2bd, 0xffb978].map((e) => new THREE.MeshPhysicalMaterial({ ...glassOpts, emissive: e, emissiveIntensity: 0 }));
  const m = {
    plaster: std(0xe9e6df, 0.82, 0, { map: concreteMap }),
    concrete: std(0xd9d6cf, 0.9, 0, { map: concreteMap }),
    brick: std(0xffffff, 0.92, 0, { map: brickMap }),
    stone: std(0xffffff, 0.8, 0, { map: stoneMap }),
    greyConcrete: std(0x9c9c98, 0.9, 0, { map: concreteMap }),
    metal: std(0x3a3f45, 0.38, 0.75),
    facadeGlass,
    litGlass,
    pillar: std(0x8f8b84, 0.85),
    dark: std(0x1f2329, 0.5, 0.55),
    navy: std(0x262d3b, 0.7, 0.05),
    wood: std(0xffffff, 0.6, 0, { map: wood }),
    orange: std(0xa8562f, 0.7),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x8ea6b8, roughness: 0.06, metalness: 0.35, transparent: true, opacity: 0.42, envMapIntensity: 1.6 }),
    railGlass: new THREE.MeshPhysicalMaterial({ color: 0xbfd2de, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22 }),
    interiorDark: std(0x171b22, 0.95),
    lit,
    lamps,
    grass: std(0xffffff, 1, 0, { map: grassMap }),
    hedge: std(0x35602f, 1),
    leaves: [std(0x35592c, 0.95), std(0x42683a, 0.95), std(0x557a40, 0.95), std(0x2c4a26, 0.95)],
    trunk: std(0x4a3a2a, 1),
    asphalt: std(0xffffff, 0.92, 0, { map: asphaltMap }),
    sidewalk: std(0xa9a69e, 0.95),
    paver: std(0xffffff, 0.88, 0, { map: paverMap }),
    marking: std(0xe9e6dc, 0.8),
    pot: std(0xe8e6e0, 0.7),
    tire: std(0x111214, 0.9),
    headlight: std(0xffffff, 0.3, 0, { emissive: 0xfff2d0, emissiveIntensity: 2 }),
    taillight: std(0x550000, 0.4, 0, { emissive: 0xff2a1a, emissiveIntensity: 1.5 }),
  };
  m.setGlow = (g) => {
    lit.forEach((x) => { x.emissiveIntensity = g; });
    litGlass.forEach((x) => { x.emissiveIntensity = g > 0.5 ? g * 0.55 : 0; });
    lamps.emissiveIntensity = Math.max(0.2, g * 1.2);
    m.headlight.emissiveIntensity = 0.6 + g;
  };
  return m;
}

/**
 * Coordenadas UV en metros para una caja: así las texturas (concreto, ladrillo, piedra) conservan su
 * escala real en cualquier tamaño en vez de estirarse sobre cada cara.
 */
function metricUV(geo, w, h, d) {
  const uv = geo.attributes.uv;
  // Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z (4 vértices cada una).
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
  }
  return geo;
}

/** Caja con su base en y. */
function box(THREE, parent, w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(metricUV(new THREE.BoxGeometry(w, h, d), w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Ventanal con interior: vidrio al frente y, detrás, una habitación encendida o en penumbra. */
function glazing(THREE, parent, M, r, w, h, x, y, z, { facing = 1, lit = 0.6, mullions = 2 } = {}) {
  const inner = r() < lit ? M.lit[Math.floor(r() * M.lit.length)] : M.interiorDark;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), inner);
  back.position.set(x, y + h / 2, z - facing * 0.45);
  if (facing < 0) back.rotation.y = Math.PI;
  parent.add(back);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.glass);
  pane.position.set(x, y + h / 2, z);
  if (facing < 0) pane.rotation.y = Math.PI;
  parent.add(pane);
  for (let i = 0; i <= mullions; i++) box(THREE, parent, 0.05, h, 0.08, M.dark, x - w / 2 + (i * w) / mullions, y, z);
  box(THREE, parent, w, 0.06, 0.1, M.dark, x, y, z);
  box(THREE, parent, w, 0.06, 0.1, M.dark, x, y + h - 0.06, z);
}

/** Baranda de barrotes verticales (instanciada para no multiplicar los objetos). */
function barRailing(THREE, parent, M, length, x, y, z, rotY = 0, h = 1.05) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const count = Math.max(2, Math.round(length / 0.13));
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, h, 0.025), M.dark, count);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < count; i++) bars.setMatrixAt(i, mtx.makeTranslation(-length / 2 + (i * length) / (count - 1), h / 2, 0));
  bars.castShadow = true;
  g.add(bars);
  box(THREE, g, length, 0.05, 0.06, M.dark, 0, h, 0);
  parent.add(g);
}

function plant(THREE, parent, M, r, x, y, z, s = 1) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.17 * s, 0.4 * s, 12), M.pot);
  pot.position.set(x, y + 0.2 * s, z);
  pot.castShadow = true;
  parent.add(pot);
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry((0.32 + r() * 0.2) * s, 0), M.leaves[i % 3]);
    leaf.position.set(x + (r() - 0.5) * 0.3 * s, y + (0.65 + i * 0.22) * s, z + (r() - 0.5) * 0.3 * s);
    leaf.castShadow = true;
    parent.add(leaf);
  }
}

export function tree(THREE, M, r, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.2 * s, 3.4 * s, 10), M.trunk);
  trunk.position.y = 1.7 * s;
  trunk.castShadow = true;
  g.add(trunk);
  for (const side of [-1, 1]) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.08 * s, 1.6 * s, 6), M.trunk);
    branch.position.set(side * 0.35 * s, 2.9 * s, 0);
    branch.rotation.z = -side * 0.7;
    g.add(branch);
  }
  // Copa: varias esferas con la superficie irregular, para que se lea como follaje y no como un sólido.
  // Muchos racimos pequeños repartidos en un elipsoide: la silueta queda irregular y con huecos de luz.
  const clusters = 34 + Math.floor(r() * 12);
  for (let i = 0; i < clusters; i++) {
    // Vértices soldados: la deformación no abre grietas y las normales quedan suaves (follaje, no facetas).
    const ico = new THREE.IcosahedronGeometry(1, 2);
    ico.deleteAttribute('normal');
    ico.deleteAttribute('uv');
    const geo = mergeVertices(ico);
    ico.dispose();
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const f = 0.72 + r() * 0.4;
      pos.setXYZ(k, pos.getX(k) * f, pos.getY(k) * f * 0.82, pos.getZ(k) * f);
    }
    geo.computeVertexNormals();
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
    const leaf = new THREE.Mesh(geo, M.leaves[Math.floor(r() * M.leaves.length)]);
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 1.7;
    const up = r();
    leaf.position.set(Math.cos(a) * rad * s, (3.6 + up * 2.6 + (1.7 - rad) * 0.4) * s, Math.sin(a) * rad * s);
    leaf.scale.setScalar((0.42 + r() * 0.36) * s);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    g.add(leaf);
  }
  return g;
}

// ------------------------------------------------------------------ edificios

/** Edificio de apartamentos de 4 niveles: primer piso libre con parqueaderos, losas en voladizo con balcones y pérgola en la cubierta. */
export function apartmentBlock(THREE, M, r, { floors = 3 } = {}) {
  const g = new THREE.Group();
  const W = 26; const D = 14; const G = 3.4; const FH = 3.2; const T = 0.32;
  // Primer piso: columnas y vestíbulo vidriado al fondo.
  for (const x of [-12, -6, 0, 6, 12]) for (const z of [-6, 0, 5.5]) box(THREE, g, 0.6, G, 0.6, M.pillar, x, 0, z);
  box(THREE, g, W - 2, G, 0.25, M.navy, 0, 0, -6.6);
  glazing(THREE, g, M, r, 9, G - 0.3, -4, 0, 0.2, { lit: 0.9, mullions: 4 });
  box(THREE, g, 1.4, G, 0.4, M.wood, 4, 0, 0.2);
  for (let k = 0; k <= floors; k++) {
    const y = G + k * FH;
    const front = k === floors ? 1.2 : 2.3;
    box(THREE, g, W + 2.6, T, D + front + 0.6, M.plaster, 0, y - T, front / 2 - 0.3);
    if (k === floors) break;
    // Fachada retrocedida: ventanales con interior, paneles de madera y columnas de concreto.
    for (let i = 0; i < 6; i++) {
      const x = -10.5 + i * 4.2;
      if (i === 2 || i === 4) box(THREE, g, 1.6, FH - T, 0.5, M.orange, x, y, D / 2 - 0.4);
      else glazing(THREE, g, M, r, 3.6, FH - T - 0.15, x, y, D / 2 - 0.3, { lit: 0.65, mullions: 3 });
    }
    for (const sx of [-1, 1]) box(THREE, g, 0.3, FH - T, D - 1, M.concrete, sx * (W / 2 - 0.15), y, 0);
    barRailing(THREE, g, M, W + 2.4, 0, y, D / 2 + front - 0.2);
    for (const sx of [-1, 1]) barRailing(THREE, g, M, D + front - 0.6, sx * (W / 2 + 1.1), y, front / 2, Math.PI / 2);
    for (let p = 0; p < 4; p++) plant(THREE, g, M, r, -9 + p * 6 + r() * 2, y, D / 2 + front - 0.8, 1 + r() * 0.4);
  }
  // Cubierta: pérgola de perfiles metálicos sobre la terraza.
  const roof = G + floors * FH;
  for (const [x, z] of [[-6, -2], [6, -2], [-6, 5], [6, 5]]) box(THREE, g, 0.2, 2.6, 0.2, M.dark, x, roof, z);
  const top = roof + 2.6;
  for (const z of [-2.5, 0.5, 3.5, 6.5]) box(THREE, g, 18, 0.16, 0.16, M.dark, 0, top, z);
  for (const x of [-9, -4.5, 0, 4.5, 9]) box(THREE, g, 0.16, 0.16, 9.2, M.dark, x, top, 2);
  box(THREE, g, 18, 1.1, 0.12, M.plaster, 0, roof, -6.4);
  return g;
}

/** Torre residencial esbelta: marco oscuro, cajones blancos con balcones de vidrio y local comercial iluminado. */
export function slimTower(THREE, M, r, { floors = 9 } = {}) {
  const g = new THREE.Group();
  const W = 10; const D = 12; const GH = 4.4; const FH = 3.05;
  const height = GH + floors * FH;
  box(THREE, g, 0.9, height, D, M.navy, -W / 2 + 0.45, 0, 0);
  box(THREE, g, 0.9, height + 1.8, D, M.plaster, W / 2 - 0.45, 0, 0);
  box(THREE, g, W, height, 0.4, M.navy, 0, 0, -D / 2 + 0.2);
  for (let k = 0; k < floors; k++) {
    const y = GH + k * FH;
    box(THREE, g, W - 1.8, 0.3, 0.9, M.navy, 0, y - 0.3, D / 2 - 0.2);
    for (const sx of [-1, 1]) {
      const x = sx * 2.1;
      // Cajón blanco que enmarca cada ventanal, con balcón de vidrio al frente.
      box(THREE, g, 3.6, 0.22, 1.6, M.plaster, x, y, D / 2 + 0.55);
      box(THREE, g, 3.6, 0.18, 1.0, M.plaster, x, y + FH - 0.5, D / 2 + 0.25);
      box(THREE, g, 0.18, FH - 0.32, 1.0, M.plaster, x - 1.71, y + 0.22, D / 2 + 0.25);
      glazing(THREE, g, M, r, 3.2, FH - 0.75, x, y + 0.22, D / 2 - 0.1, { lit: 0.8, mullions: 2 });
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.95, 0.03), M.railGlass);
      rail.position.set(x, y + 0.7, D / 2 + 1.3);
      g.add(rail);
      if (r() < 0.6) plant(THREE, g, M, r, x + 1.1, y + 0.22, D / 2 + 0.9, 0.9);
    }
    // Ventanas en franja sobre el costado blanco.
    box(THREE, g, 0.05, 0.35, 4, M.dark, W / 2 + 0.01, y + 1.3, -1);
  }
  const top = GH + floors * FH;
  glazing(THREE, g, M, r, W - 2, 2.6, 0, top, D / 2 - 1.4, { lit: 1, mullions: 6 });
  box(THREE, g, W + 0.3, 0.35, D + 0.3, M.plaster, 0, top + 2.6, -0.2);
  box(THREE, g, W - 1, 2.6, D - 3, M.navy, 0, top, -1.6);
  // Local comercial en el primer piso.
  glazing(THREE, g, M, r, W - 2, GH - 0.6, 0, 0, D / 2 - 0.4, { lit: 1, mullions: 5 });
  box(THREE, g, W - 1.6, 0.5, 0.6, M.navy, 0, GH - 0.5, D / 2 - 0.1);
  return g;
}

/** Casa contemporánea de dos pisos con volumen en voladizo, cielo raso de madera y alero de concreto. */
export function modernHouse(THREE, M, r) {
  const g = new THREE.Group();
  // Primer piso: fachada de vidrio con el interior iluminado y muro verde.
  box(THREE, g, 15, 0.3, 10, M.concrete, 0, 0, 0);
  glazing(THREE, g, M, r, 6.2, 2.9, -3.5, 0.3, 4.6, { lit: 1, mullions: 3 });
  glazing(THREE, g, M, r, 3.4, 2.9, 4.6, 0.3, 4.6, { lit: 1, mullions: 2 });
  box(THREE, g, 2.2, 2.9, 0.3, M.hedge, 1.6, 0.3, 4.55);
  box(THREE, g, 15, 2.9, 0.3, M.concrete, 0, 0.3, -4.85);
  for (const x of [-7.3, 7.3]) box(THREE, g, 0.6, 3.2, 10, M.dark, x, 0, 0);
  // Segundo piso desplazado y en voladizo, con marco oscuro.
  const y2 = 3.2;
  box(THREE, g, 13, 0.4, 11.5, M.plaster, 1, y2, 0.75);
  box(THREE, g, 13, 0.08, 2.4, M.wood, 1, y2 - 0.08, 5.3);
  glazing(THREE, g, M, r, 6.6, 2.8, -1.4, y2 + 0.4, 6.2, { lit: 0.9, mullions: 3 });
  box(THREE, g, 3.6, 2.8, 0.2, M.wood, 4.6, y2 + 0.4, 6.1);
  box(THREE, g, 0.5, 3.2, 11.5, M.dark, -5.25, y2, 0.75);
  box(THREE, g, 0.5, 3.2, 11.5, M.dark, 7.25, y2, 0.75);
  box(THREE, g, 13, 3.2, 0.3, M.concrete, 1, y2, -4.85);
  // Alero superior de concreto con cielo raso de madera.
  const y3 = y2 + 3.2;
  box(THREE, g, 16.5, 0.5, 13.5, M.plaster, 0.5, y3, 1.2);
  box(THREE, g, 16.5, 0.06, 13.5, M.wood, 0.5, y3 - 0.06, 1.2);
  box(THREE, g, 16.7, 0.25, 13.7, M.dark, 0.5, y3 + 0.5, 1.2);
  for (let i = 0; i < 8; i++) box(THREE, g, 0.12, 0.1, 3, M.dark, -3 + i * 0.5, y3 - 0.16, 6.6);
  // Luces empotradas en el alero.
  for (let i = 0; i < 6; i++) {
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), M.lamps);
    spot.rotation.x = Math.PI / 2;
    spot.position.set(-6 + i * 2.6, y3 - 0.07, 7);
    g.add(spot);
  }
  // Terraza, escalones y jardín.
  box(THREE, g, 9, 0.3, 3, M.paver, -1, 0, 6.5);
  for (let s = 0; s < 3; s++) box(THREE, g, 3.4, 0.15 * (3 - s), 0.4, M.plaster, 4.5, 0, 8.2 + s * 0.4);
  for (let i = 0; i < 9; i++) {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + r() * 0.4, 1), M.leaves[i % 3]);
    bush.position.set(-7 + i * 1.6, 0.4, 8.6 + r() * 0.6);
    bush.castShadow = true;
    g.add(bush);
  }
  return g;
}

/** Cajas instanciadas: una sola llamada de dibujo para cientos de piezas iguales (montantes, franjas, ventanas). */
export function instancedBoxes(THREE, parent, mat, items, { cast = true } = {}) {
  if (!items.length) return null;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, items.length);
  const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const p = new THREE.Vector3(); const sc = new THREE.Vector3();
  items.forEach(([x, y, z, w, h, d], i) => { mesh.setMatrixAt(i, m4.compose(p.set(x, y + h / 2, z), q, sc.set(w, h, d))); });
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  parent.add(mesh);
  return mesh;
}

/** Las cuatro fachadas de un volumen w × d: [eje, signo, ancho de la cara]. */
const FACES = (w, d) => [['z', 1, w], ['z', -1, w], ['x', 1, d], ['x', -1, d]];
/** Pieza sobre una fachada (u = posición a lo largo de la cara, out = cuánto sobresale). */
function onFace(face, w, d, u, y, out, pw, ph, depth) {
  const [axis, sign] = face;
  return axis === 'z'
    ? [u, y, sign * (d / 2 + out), pw, ph, depth]
    : [sign * (w / 2 + out), y, u, depth, ph, pw];
}

/**
 * Edificio de contexto con fachada real. Estilos:
 *  · glass: torre de muro cortina con franjas de losa y montantes metálicos.
 *  · punched: muro de ladrillo, piedra o concreto con ventanas, alféizares y algunas encendidas de noche.
 *  · band: franjas horizontales de ventana corrida y antepechos de concreto.
 */
export function contextBuilding(THREE, M, r, w, h, d, { style } = {}) {
  const g = new THREE.Group();
  const FH = 3.2;
  const floors = Math.max(2, Math.round((h - 1.2) / FH));
  const H = floors * FH;
  const kind = style || (h > 36 && r() < 0.65 ? 'glass' : r() < 0.6 ? 'punched' : 'band');
  const lit = () => (r() < 0.38 ? M.litGlass[Math.floor(r() * M.litGlass.length)] : M.facadeGlass);
  const byMat = new Map();
  const put = (mat, item) => { if (!byMat.has(mat)) byMat.set(mat, []); byMat.get(mat).push(item); };

  if (kind === 'glass') {
    for (let k = 0; k < floors; k++) put(lit(), [0, k * FH, 0, w - 0.1, FH, d - 0.1]);
    const bands = []; const mullions = [];
    for (let k = 0; k <= floors; k++) {
      const y = Math.max(0, k * FH - 0.18);
      bands.push([0, y, d / 2, w + 0.06, 0.36, 0.12], [0, y, -d / 2, w + 0.06, 0.36, 0.12]);
      bands.push([w / 2, y, 0, 0.12, 0.36, d + 0.06], [-w / 2, y, 0, 0.12, 0.36, d + 0.06]);
    }
    for (const face of FACES(w, d)) {
      const n = Math.max(2, Math.round(face[2] / 1.5));
      for (let i = 0; i <= n; i++) mullions.push(onFace(face, w, d, -face[2] / 2 + (i * face[2]) / n, 0, 0, 0.07, H, 0.14));
    }
    instancedBoxes(THREE, g, M.metal, bands);
    instancedBoxes(THREE, g, M.metal, mullions, { cast: false });
    box(THREE, g, w + 0.2, 1.4, d + 0.2, M.metal, 0, H, 0);
  } else {
    const wall = kind === 'band'
      ? [M.concrete, M.plaster, M.greyConcrete][Math.floor(r() * 3)]
      : [M.brick, M.brick, M.stone, M.plaster, M.concrete][Math.floor(r() * 5)];
    box(THREE, g, w, H, d, wall);
    const sills = [];
    for (const face of FACES(w, d)) {
      if (kind === 'band') {
        for (let k = 0; k < floors; k++) put(lit(), onFace(face, w, d, 0, k * FH + 0.95, 0.03, face[2] - 1.2, 1.75, 0.06));
        continue;
      }
      const n = Math.max(1, Math.floor((face[2] - 1) / 3));
      const step = face[2] / n;
      for (let k = 0; k < floors; k++) for (let i = 0; i < n; i++) {
        const u = -face[2] / 2 + step * (i + 0.5);
        put(lit(), onFace(face, w, d, u, k * FH + 0.9, 0.03, Math.min(1.7, step - 0.9), 1.65, 0.06));
        sills.push(onFace(face, w, d, u, k * FH + 0.82, 0.06, Math.min(1.9, step - 0.7), 0.08, 0.16));
      }
    }
    instancedBoxes(THREE, g, M.stone, sills, { cast: false });
    box(THREE, g, w + 0.3, 0.9, d + 0.3, wall === M.brick ? M.stone : wall, 0, H, 0); // cornisa / antepecho
  }
  for (const [mat, items] of byMat) instancedBoxes(THREE, g, mat, items, { cast: false });
  // Cubierta: cuartos de máquinas y equipos, para que la silueta no sea una caja perfecta.
  const units = 1 + Math.floor(r() * 3);
  for (let i = 0; i < units; i++) {
    const uw = 2 + r() * Math.min(6, w * 0.3); const ud = 2 + r() * Math.min(5, d * 0.3);
    box(THREE, g, uw, 1.2 + r() * 2.2, ud, i === 0 ? M.greyConcrete : M.metal, (r() - 0.5) * (w - uw - 1), H + (kind === 'glass' ? 1.4 : 0.9), (r() - 0.5) * (d - ud - 1));
  }
  g.userData.height = H;
  return g;
}

/**
 * Fusiona la geometría estática de un grupo por material: cientos de cajas se dibujan en unas pocas
 * llamadas y la escena va fluida incluso en portátiles. Las instancias y lo que esté en skip no se tocan.
 */
export function mergeStatic(THREE, root, skip = []) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const buckets = new Map();
  const victims = [];
  const walk = (o) => {
    if (skip.includes(o)) return;
    if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !Array.isArray(o.material) && o.visible && !o.userData.keep) {
      const src = o.geometry;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', src.attributes.position.clone());
      if (src.attributes.normal) geo.setAttribute('normal', src.attributes.normal.clone());
      geo.setAttribute('uv', src.attributes.uv ? src.attributes.uv.clone() : new THREE.BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
      if (src.index) geo.setIndex(src.index.clone());
      geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));
      const key = `${o.material.uuid}|${src.index ? 'i' : 'n'}|${src.attributes.normal ? 1 : 0}`;
      if (!buckets.has(key)) buckets.set(key, { mat: o.material, geos: [], cast: false, receive: false });
      const b = buckets.get(key);
      b.geos.push(geo);
      b.cast ||= o.castShadow;
      b.receive ||= o.receiveShadow;
      victims.push(o);
    }
    o.children.forEach(walk);
  };
  root.children.forEach(walk);
  for (const o of victims) { o.parent.remove(o); o.geometry.dispose(); }
  for (const { mat, geos, cast, receive } of buckets.values()) {
    const merged = mergeGeometries(geos, false);
    geos.forEach((x) => x.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    root.add(mesh);
  }
  return root;
}

// ------------------------------------------------------------------ calle

/** Calle a lo largo de X: calzada, líneas, andenes, bordillos, zonas verdes, árboles y faroles. */
export function street(THREE, M, r, { length = 160, z = 0, trees = true, treeSides = [-1, 1] } = {}) {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(length, 8), M.asphalt);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.01, z);
  road.receiveShadow = true;
  g.add(road);
  for (let x = -length / 2; x < length / 2; x += 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.14), M.marking);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x + 1.5, 0.02, z);
    g.add(dash);
  }
  for (const side of [-1, 1]) {
    box(THREE, g, length, 0.16, 0.2, M.plaster, 0, 0, z + side * 4.1);
    box(THREE, g, length, 0.15, 3, M.sidewalk, 0, 0, z + side * 5.7);
    const verge = new THREE.Mesh(new THREE.PlaneGeometry(length, 1.6), M.grass);
    verge.rotation.x = -Math.PI / 2;
    verge.position.set(0, 0.16, z + side * 8);
    verge.receiveShadow = true;
    g.add(verge);
    if (!treeSides.includes(side)) continue; // ese andén queda libre (allí se ubica la cámara)
    if (trees) {
      for (let x = -length / 2 + 6; x < length / 2; x += 16 + r() * 6) {
        const t = tree(THREE, M, r, 0.9 + r() * 0.3);
        t.position.set(x, 0.15, z + side * 8);
        g.add(t);
      }
    }
    for (let x = -length / 2 + 12; x < length / 2; x += 22) {
      box(THREE, g, 0.12, 6, 0.12, M.dark, x, 0.15, z + side * 4.5);
      box(THREE, g, 1.4, 0.1, 0.12, M.dark, x - side * 0, 6.1, z + side * 4.0);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.25), M.lamps);
      bulb.position.set(x, 6.05, z + side * 3.5);
      g.add(bulb);
    }
  }
  g.userData.lanes = [z - 2, z + 2];
  g.userData.walks = [z - 5.7, z + 5.7];
  return g;
}

const carParts = new WeakMap();
/** Geometrías compartidas por todos los autos (se crean una vez por juego de materiales). */
function carKit(THREE, M) {
  if (carParts.has(M)) return carParts.get(M);
  const shape = (pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; };
  const extrude = (pts, depth, bevel) => {
    const geo = new THREE.ExtrudeGeometry(shape(pts), { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4 });
    geo.translate(0, 0, -depth / 2);
    geo.computeVertexNormals();
    return geo;
  };
  // Perfil lateral de un sedán compacto (x a lo largo, y hacia arriba), unos 4,4 m de largo, con pasos de rueda.
  const body = extrude([[-2.12, 0.3], [-2.2, 0.52], [-2.14, 0.86], [-1.62, 0.96], [-1.0, 0.98], [1.02, 0.98], [1.95, 0.84], [2.18, 0.66], [2.18, 0.42], [2.08, 0.3],
    [1.78, 0.3], [1.66, 0.6], [1.14, 0.6], [1.02, 0.3], [-1.02, 0.3], [-1.14, 0.6], [-1.66, 0.6], [-1.78, 0.3]], 1.62, 0.08);
  const cabin = extrude([[-1.58, 0.95], [-0.92, 1.4], [0.3, 1.42], [1.06, 0.96]], 1.5, 0.05);
  const roof = extrude([[-0.88, 1.38], [0.28, 1.4], [0.24, 1.47], [-0.82, 1.45]], 1.42, 0.05);
  const tire = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 24);
  tire.rotateX(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(0.21, 0.21, 0.235, 18);
  rim.rotateX(Math.PI / 2);
  const kit = {
    body, cabin, roof, tire, rim,
    window: new THREE.MeshPhysicalMaterial({ color: 0x0d1117, roughness: 0.03, metalness: 0, ior: 1.5, envMapIntensity: 1.4 }),
    rimMat: new THREE.MeshStandardMaterial({ color: 0xb9bdc2, roughness: 0.25, metalness: 0.9 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.55, metalness: 0.2 }),
  };
  carParts.set(M, kit);
  return kit;
}

/** Automóvil: carrocería con perfil real, pintura con barniz que refleja el cielo, vidrios, llantas con rin y luces. */
export function car(THREE, M, color) {
  const K = carKit(THREE, M);
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: 0.32, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.06 });
  const add = (geo, mat, x = 0, y = 0, z = 0, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  add(K.body, paint);
  add(K.cabin, K.window);
  add(K.roof, paint);
  for (const x of [-1.4, 1.4]) for (const z of [-0.8, 0.8]) {
    add(K.tire, M.tire, x, 0.33, z);
    add(K.rim, K.rimMat, x, 0.33, z, false);
  }
  // Parachoques, faros, calaveras, espejos y manijas.
  box(THREE, g, 0.12, 0.16, 1.66, K.trim, 2.22, 0.3, 0);
  box(THREE, g, 0.12, 0.16, 1.66, K.trim, -2.24, 0.3, 0);
  box(THREE, g, 0.06, 0.1, 1.2, K.trim, 2.25, 0.5, 0);
  for (const z of [-0.6, 0.6]) {
    box(THREE, g, 0.08, 0.1, 0.36, M.headlight, 2.2, 0.68, z);
    box(THREE, g, 0.06, 0.09, 0.42, M.taillight, -2.21, 0.78, z);
    box(THREE, g, 0.16, 0.1, 0.12, paint, 0.95, 0.98, z * 1.55);
    box(THREE, g, 0.18, 0.03, 0.02, K.trim, -0.2, 0.86, z * 1.37);
    box(THREE, g, 0.18, 0.03, 0.02, K.trim, 0.65, 0.86, z * 1.37);
  }
  return g;
}

// ------------------------------------------------------------------ personas

// Ropa con colores de calle reales (apagados, como en una foto): [prenda superior, pantalón o falda].
const OUTFITS = [[0x2c3e57, 0x22262d], [0x8a3b32, 0x2b2f38], [0xd9d3c7, 0x3d4558], [0x45563e, 0x1f2329], [0xb08a4e, 0x2a2e36],
  [0x4a3f5c, 0x23262c], [0xeeeeea, 0x5a4b3e], [0x1d1f23, 0x6d6a63], [0x7e8b96, 0x1c2433], [0xa45a3c, 0x3b3f46]];
const SKIN = [0xe0b48f, 0xc48660, 0x8b583a, 0xefcaa8, 0x6a4029, 0xd7a07a];
const HAIR = [0x1a1410, 0x3a281b, 0x6e4f32, 0x0f0f10, 0xb59a6e, 0x8c8c8c];

const personParts = { geo: null };
/** Geometrías del cuerpo compartidas por todas las personas (solo cambian los materiales). */
function bodyGeometry(THREE) {
  if (personParts.geo) return personParts.geo;
  // Torso modelado por revolución: cadera, cintura, pecho y hombros.
  const torso = new THREE.LatheGeometry([[0, 0], [0.155, 0.0], [0.16, 0.08], [0.145, 0.2], [0.165, 0.34], [0.19, 0.46], [0.17, 0.52], [0.07, 0.58], [0, 0.58]]
    .map(([x, y]) => new THREE.Vector2(x, y)), 16);
  torso.scale(1, 1, 0.62);
  const cap = (rad, len) => new THREE.CapsuleGeometry(rad, len, 4, 10).translate(0, -len / 2 - rad, 0);
  personParts.geo = {
    torso,
    thigh: cap(0.075, 0.34), shin: cap(0.06, 0.34), upper: cap(0.05, 0.24), fore: cap(0.042, 0.22),
    hand: new THREE.SphereGeometry(0.045, 10, 8).scale(0.8, 1.2, 0.6),
    shoe: new THREE.BoxGeometry(0.1, 0.07, 0.25).translate(0, -0.035, 0.05),
    neck: new THREE.CylinderGeometry(0.045, 0.05, 0.09, 10),
    head: new THREE.SphereGeometry(0.1, 18, 14).scale(0.88, 1.08, 0.98),
    hairShort: new THREE.SphereGeometry(0.106, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.52).scale(0.9, 1.08, 1.02),
    hairLong: new THREE.CylinderGeometry(0.1, 0.085, 0.26, 14, 1, true, Math.PI * 0.6, Math.PI * 1.8).translate(0, -0.1, -0.01),
    skirt: new THREE.CylinderGeometry(0.17, 0.26, 0.42, 16).translate(0, -0.21, 0),
    bag: new THREE.BoxGeometry(0.08, 0.26, 0.32),
  };
  return personParts.geo;
}

/** Persona a escala real (1,55–1,90 m) con rodillas, codos, manos y zapatos, que camina con balanceo natural. */
export function person(THREE, r) {
  const G = bodyGeometry(THREE);
  const [shirt, pants] = OUTFITS[Math.floor(r() * OUTFITS.length)];
  const mat = (color, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness });
  const skin = mat(SKIN[Math.floor(r() * SKIN.length)], 0.7);
  const top = mat(shirt);
  const bottom = mat(pants, 0.9);
  const hair = mat(HAIR[Math.floor(r() * HAIR.length)], 0.75);
  const shoes = mat([0x151515, 0x3a2a1e, 0xe8e6e0, 0x222831][Math.floor(r() * 4)], 0.6);
  const feminine = r() < 0.5;
  const g = new THREE.Group();
  const part = (geo, m, parent, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    parent.add(o);
    return o;
  };
  const joint = (parent, x, y, z = 0) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; };

  const hip = joint(g, 0, 0.92);
  const legs = [-1, 1].map((side) => {
    const thigh = joint(hip, side * 0.085, 0);
    part(G.thigh, bottom, thigh);
    const knee = joint(thigh, 0, -0.49);
    part(G.shin, feminine && r() < 0.5 ? skin : bottom, knee);
    part(G.shoe, shoes, knee, 0, -0.43);
    return { thigh, knee };
  });
  const chest = joint(hip, 0, 0);
  part(G.torso, top, chest, 0, -0.04);
  if (feminine && r() < 0.45) part(G.skirt, bottom, chest, 0, 0.08);
  part(G.neck, skin, chest, 0, 0.6);
  const head = part(G.head, skin, chest, 0, 0.72);
  part(G.hairShort, hair, head, 0, 0.012, -0.004);
  if (feminine) part(G.hairLong, hair, head, 0, 0, 0);
  const arms = [-1, 1].map((side) => {
    const shoulder = joint(chest, side * 0.2, 0.5);
    shoulder.rotation.z = side * 0.06;
    part(G.upper, top, shoulder);
    const elbow = joint(shoulder, 0, -0.34);
    part(G.fore, r() < 0.6 ? skin : top, elbow);
    part(G.hand, skin, elbow, 0, -0.34);
    return { shoulder, elbow };
  });
  if (r() < 0.3) part(G.bag, mat([0x2a2420, 0x6b4a2e, 0x111111][Math.floor(r() * 3)], 0.6), arms[1].elbow, 0.06, -0.42);

  g.scale.setScalar((feminine ? 0.93 : 1.0) * (0.95 + r() * 0.1));
  const phase = r() * Math.PI * 2;
  g.userData.walk = (t, speed) => {
    const w = t * 5.6 * speed + phase;
    const s = Math.sin(w);
    legs.forEach(({ thigh, knee }, i) => {
      const k = i ? -s : s;
      thigh.rotation.x = k * 0.42;
      // La rodilla solo se dobla hacia atrás, sobre todo cuando la pierna avanza.
      knee.rotation.x = Math.max(0, Math.sin(w + (i ? Math.PI : 0) + 1.2)) * 0.65;
    });
    arms.forEach(({ shoulder, elbow }, i) => {
      shoulder.rotation.x = (i ? s : -s) * 0.32;
      elbow.rotation.x = -0.18 - Math.max(0, i ? -s : s) * 0.25;
    });
    hip.position.y = 0.92 + Math.abs(Math.cos(w)) * 0.025;
    hip.rotation.y = s * 0.08;
    chest.rotation.y = -s * 0.12;
  };
  g.userData.walk(0, 1);
  return g;
}

/**
 * Personas que recorren rutas en bucle. Cada ruta es una lista de puntos [x, z].
 * Devuelve { group, update(dt) }.
 */
export function crowd(THREE, r, routes, count = 12) {
  const group = new THREE.Group();
  const walkers = [];
  for (let i = 0; i < count; i++) {
    const route = routes[i % routes.length];
    const lengths = route.map((p, k) => Math.hypot(route[(k + 1) % route.length][0] - p[0], route[(k + 1) % route.length][1] - p[1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    const p = person(THREE, r);
    group.add(p);
    walkers.push({ p, route, lengths, total, d: r() * total, speed: 1.1 + r() * 0.5, dir: r() < 0.5 ? 1 : -1, t: 0 });
  }
  const update = (dt) => {
    for (const w of walkers) {
      w.t += dt;
      w.d = (w.d + w.dir * w.speed * dt + w.total) % w.total;
      let d = w.d; let k = 0;
      while (d > w.lengths[k]) { d -= w.lengths[k]; k = (k + 1) % w.route.length; }
      const a = w.route[k]; const b = w.route[(k + 1) % w.route.length];
      const f = w.lengths[k] ? d / w.lengths[k] : 0;
      w.p.position.set(a[0] + (b[0] - a[0]) * f, 0.15, a[1] + (b[1] - a[1]) * f);
      w.p.rotation.y = Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir);
      w.p.userData.walk(w.t, w.speed);
    }
  };
  return { group, update };
}

/** Autos que circulan por los carriles de una calle. */
export function traffic(THREE, M, r, lanes, length, count = 4) {
  const group = new THREE.Group();
  const colors = [0xf2f2f0, 0x1f3a63, 0x9a1f1f, 0x2a2d33, 0xb9bcc2, 0x3c5a3a];
  const cars = [];
  for (let i = 0; i < count; i++) {
    const c = car(THREE, M, colors[i % colors.length]);
    const lane = i % 2;
    c.position.z = lanes[lane];
    c.rotation.y = lane === 0 ? Math.PI : 0;
    group.add(c);
    cars.push({ c, x: -length / 2 + r() * length, v: (6 + r() * 5) * (lane === 0 ? -1 : 1) });
  }
  const update = (dt) => {
    for (const k of cars) {
      k.x += k.v * dt;
      if (k.x > length / 2) k.x = -length / 2;
      if (k.x < -length / 2) k.x = length / 2;
      k.c.position.x = k.x;
    }
  };
  return { group, update };
}
