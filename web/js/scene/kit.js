// Kit de escena arquitectónica: materiales, edificios inspirados en renders reales, calle, árboles,
// autos y personas. Unidades en metros, eje Y hacia arriba y fachada principal mirando a +Z.

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
  const concreteMap = noiseTexture(THREE, 256, (g, n) => {
    speckle(g, n, '#bdb9b1', ['rgba(150,146,140,.35)', 'rgba(210,206,198,.35)', 'rgba(120,116,110,.25)'], 9000, 1, 3);
  }, 1);
  const lit = [
    std(0x2e261d, 0.9, 0, { emissive: 0xffc480, emissiveIntensity: 1 }),
    std(0x2b261f, 0.9, 0, { emissive: 0xffe1b3, emissiveIntensity: 1 }),
    std(0x24221f, 0.9, 0, { emissive: 0xffb466, emissiveIntensity: 1 }),
  ];
  const lamps = std(0xfff3d6, 0.4, 0, { emissive: 0xffdca8, emissiveIntensity: 1 });
  const m = {
    plaster: std(0xf1efea, 0.8, 0, { map: concreteMap }),
    concrete: std(0xffffff, 0.9, 0, { map: concreteMap }),
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
    lamps.emissiveIntensity = Math.max(0.2, g * 1.2);
    m.headlight.emissiveIntensity = 0.6 + g;
  };
  return m;
}

/** Caja con su base en y. */
function box(THREE, parent, w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
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
  const clusters = 9 + Math.floor(r() * 4);
  for (let i = 0; i < clusters; i++) {
    const geo = new THREE.SphereGeometry(1, 14, 10);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const f = 0.82 + r() * 0.3;
      pos.setXYZ(k, pos.getX(k) * f, pos.getY(k) * f * 0.85, pos.getZ(k) * f);
    }
    geo.computeVertexNormals();
    const leaf = new THREE.Mesh(geo, M.leaves[Math.floor(r() * M.leaves.length)]);
    const a = (i / clusters) * Math.PI * 2;
    const ring = i === 0 ? 0 : 0.9 + r() * 0.7;
    leaf.position.set(Math.cos(a) * ring * s, (3.9 + r() * 1.6 + (i === 0 ? 0.8 : 0)) * s, Math.sin(a) * ring * s);
    leaf.scale.setScalar((0.95 + r() * 0.6) * s);
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

/** Edificio de contexto, más simple, para completar la manzana. */
export function contextBuilding(THREE, M, r, w, h, d) {
  const g = new THREE.Group();
  box(THREE, g, w, h, d, r() < 0.5 ? M.concrete : M.plaster);
  const rows = Math.floor(h / 3.1);
  const cols = Math.max(1, Math.floor(w / 3.2));
  const strip = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 1.5), M.lit[0], rows * cols);
  const dark = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 1.5), M.interiorDark, rows * cols);
  const mtx = new THREE.Matrix4();
  let a = 0; let b = 0;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    mtx.makeTranslation(-w / 2 + 1.6 + i * 3.2, 1.8 + j * 3.1, d / 2 + 0.01);
    if (r() < 0.45) strip.setMatrixAt(a++, mtx); else dark.setMatrixAt(b++, mtx);
  }
  strip.count = a;
  dark.count = b;
  g.add(strip, dark);
  return g;
}

// ------------------------------------------------------------------ calle

/** Calle a lo largo de X: calzada, líneas, andenes, bordillos, zonas verdes, árboles y faroles. */
export function street(THREE, M, r, { length = 160, z = 0, trees = true } = {}) {
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
    if (!trees) continue;
    for (let x = -length / 2 + 6; x < length / 2; x += 16 + r() * 6) {
      const t = tree(THREE, M, r, 0.9 + r() * 0.3);
      t.position.set(x, 0.15, z + side * 8);
      g.add(t);
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

/** Automóvil sencillo con luces. */
export function car(THREE, M, color) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.6 });
  box(THREE, g, 4.3, 0.75, 1.8, paint, 0, 0.35, 0);
  const cabin = box(THREE, g, 2.4, 0.65, 1.62, M.glass, -0.2, 1.1, 0);
  cabin.castShadow = false;
  box(THREE, g, 2.3, 0.08, 1.64, paint, -0.2, 1.73, 0);
  for (const x of [-1.4, 1.4]) for (const z of [-0.85, 0.85]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16), M.tire);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.34, z);
    g.add(wheel);
  }
  for (const z of [-0.6, 0.6]) {
    box(THREE, g, 0.05, 0.14, 0.32, M.headlight, 2.15, 0.75, z);
    box(THREE, g, 0.05, 0.12, 0.3, M.taillight, -2.15, 0.78, z);
  }
  return g;
}

// ------------------------------------------------------------------ personas

const OUTFITS = [[0x2f4a6d, 0x23272e], [0xb8463a, 0x2b2f38], [0xe4ddd0, 0x3b4252], [0x3f6b4c, 0x1f2329], [0xd9a441, 0x2a2e36], [0x6b4c8a, 0x22262c], [0xf0f0ee, 0x5a4636]];
const SKIN = [0xe2b896, 0xc68a62, 0x8d5a3b, 0xf1cfb2, 0x6e432b];

/** Persona de baja poligonización con brazos y piernas articulados para caminar. */
export function person(THREE, r) {
  const [shirt, pants] = OUTFITS[Math.floor(r() * OUTFITS.length)];
  const skin = new THREE.MeshStandardMaterial({ color: SKIN[Math.floor(r() * SKIN.length)], roughness: 0.8 });
  const top = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.85 });
  const bottom = new THREE.MeshStandardMaterial({ color: pants, roughness: 0.9 });
  const hair = new THREE.MeshStandardMaterial({ color: [0x1c1612, 0x3b2a1e, 0x7a5a3a, 0x111111][Math.floor(r() * 4)], roughness: 0.9 });
  const s = 0.92 + r() * 0.16;
  const g = new THREE.Group();
  const limb = (w, h, mat, x, y) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(w, h, 3, 8), mat);
    mesh.position.y = -h / 2 - w;
    mesh.castShadow = true;
    pivot.add(mesh);
    g.add(pivot);
    return pivot;
  };
  const legL = limb(0.075, 0.62, bottom, -0.1, 0.92);
  const legR = limb(0.075, 0.62, bottom, 0.1, 0.92);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 4, 10), top);
  torso.position.y = 1.2;
  torso.scale.z = 0.7;
  torso.castShadow = true;
  g.add(torso);
  const armL = limb(0.055, 0.5, top, -0.25, 1.45);
  const armR = limb(0.055, 0.5, top, 0.25, 1.45);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 14, 12), skin);
  head.position.y = 1.66;
  head.castShadow = true;
  g.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hair);
  cap.position.y = 1.68;
  g.add(cap);
  g.scale.setScalar(s);
  const phase = r() * Math.PI * 2;
  g.userData.walk = (t, speed) => {
    const a = Math.sin(t * 7 * speed + phase) * 0.55;
    legL.rotation.x = a;
    legR.rotation.x = -a;
    armL.rotation.x = -a * 0.8;
    armR.rotation.x = a * 0.8;
    torso.position.y = 1.2 + Math.abs(Math.cos(t * 7 * speed + phase)) * 0.03;
  };
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
