// Elementos paramétricos del modelador de CIVIA: definición (parámetros con unidades), materiales
// PBR con texturas procedurales y la geometría de cada tipo. Unidades en metros; eje Y hacia arriba.
// Esquema de un elemento: { id, type, material, params: {...}, position: [x, y, z], rotation: grados en Y }.

export const MATERIALS = {
  concreto: { label: 'Concreto', color: 0xb9b7b1 },
  acero: { label: 'Acero', color: 0x9aa3ad },
  madera: { label: 'Madera', color: 0x9b6a3f },
  vidrio: { label: 'Vidrio', color: 0xcfe6f2 },
  ladrillo: { label: 'Ladrillo', color: 0xa85a3c },
  bloque: { label: 'Bloque de concreto', color: 0x9c9d9a },
  pintura: { label: 'Pañete y pintura', color: 0xeeebe4 },
  teja: { label: 'Teja de barro', color: 0x9c4a2f },
};

const P = (label, unit, def, min, max, step = 0.01) => ({ label, unit, def, min, max, step });

/** Tipos de elemento: icono, materiales permitidos y parámetros. */
export const TYPES = {
  column: {
    label: 'Columna', icon: 'columns', category: 'Estructura', materials: ['concreto', 'acero', 'madera'], material: 'concreto',
    params: { shape: { label: 'Sección', options: { rect: 'Rectangular', circular: 'Circular' }, def: 'rect' },
      b: P('Ancho b', 'm', 0.4, 0.1, 3), h: P('Fondo h', 'm', 0.4, 0.1, 3), height: P('Altura', 'm', 3, 0.3, 30, 0.05) },
  },
  beam: {
    label: 'Viga', icon: 'beam', category: 'Estructura', materials: ['concreto', 'acero', 'madera'], material: 'concreto',
    params: { profile: { label: 'Perfil', options: { rect: 'Rectangular', I: 'I (acero)' }, def: 'rect' },
      b: P('Ancho', 'm', 0.3, 0.1, 2), h: P('Peralte', 'm', 0.5, 0.1, 3), length: P('Longitud', 'm', 5, 0.3, 60, 0.05) },
  },
  slab: {
    label: 'Losa', icon: 'layers', category: 'Estructura', materials: ['concreto', 'madera'], material: 'concreto',
    params: { width: P('Ancho (X)', 'm', 5, 0.3, 80, 0.05), length: P('Largo (Z)', 'm', 5, 0.3, 80, 0.05), thickness: P('Espesor', 'm', 0.15, 0.05, 1) },
  },
  footing: {
    label: 'Zapata', icon: 'layers', category: 'Estructura', materials: ['concreto'], material: 'concreto',
    params: { width: P('Ancho', 'm', 1.6, 0.4, 10, 0.05), length: P('Largo', 'm', 1.6, 0.4, 10, 0.05), thickness: P('Espesor', 'm', 0.4, 0.2, 2, 0.05) },
  },
  wall: {
    label: 'Muro', icon: 'brick', category: 'Cerramiento', materials: ['ladrillo', 'bloque', 'concreto', 'pintura'], material: 'ladrillo',
    params: { length: P('Longitud', 'm', 4, 0.2, 60, 0.05), height: P('Altura', 'm', 2.6, 0.3, 20, 0.05), thickness: P('Espesor', 'm', 0.15, 0.05, 0.6) },
  },
  door: {
    label: 'Puerta', icon: 'door', category: 'Carpintería', materials: ['madera', 'acero', 'vidrio'], material: 'madera',
    params: { width: P('Ancho', 'm', 0.9, 0.6, 3), height: P('Altura', 'm', 2.1, 1.8, 3.5), depth: P('Espesor del muro', 'm', 0.15, 0.05, 0.6) },
  },
  window: {
    label: 'Ventana', icon: 'window', category: 'Carpintería', materials: ['vidrio'], material: 'vidrio',
    params: { width: P('Ancho', 'm', 1.2, 0.3, 6), height: P('Altura', 'm', 1.2, 0.3, 4), sill: P('Antepecho', 'm', 0.9, 0, 3), depth: P('Espesor del muro', 'm', 0.15, 0.05, 0.6) },
  },
  stair: {
    label: 'Escalera', icon: 'stairs', category: 'Circulación', materials: ['concreto', 'madera', 'acero'], material: 'concreto',
    params: { width: P('Ancho', 'm', 1.1, 0.6, 4, 0.05), steps: P('Peldaños', '', 16, 2, 40, 1), riser: P('Contrahuella', 'm', 0.175, 0.12, 0.22, 0.005), tread: P('Huella', 'm', 0.28, 0.22, 0.4, 0.005) },
  },
  roof: {
    label: 'Cubierta', icon: 'roof', category: 'Cerramiento', materials: ['teja', 'concreto', 'acero', 'madera'], material: 'teja',
    params: { width: P('Ancho (X)', 'm', 8, 1, 60, 0.05), length: P('Largo (Z)', 'm', 10, 1, 80, 0.05), pitch: P('Pendiente', '°', 20, 0, 60, 1), thickness: P('Espesor', 'm', 0.12, 0.03, 0.5) },
  },
};

let seq = 0;
export const newId = () => `e${Date.now().toString(36)}${(seq++).toString(36)}`;

export function defaultParams(type) {
  return Object.fromEntries(Object.entries(TYPES[type].params).map(([k, p]) => [k, p.def]));
}

export function createElement(type, position = [0, 0, 0], rotation = 0) {
  return { id: newId(), type, material: TYPES[type].material, params: defaultParams(type), position, rotation };
}

/** Lee un número de los parámetros dentro de su rango (los datos guardados pueden venir de cualquier parte). */
function num(el, key) {
  const spec = TYPES[el.type].params[key];
  const v = Number(el.params?.[key]);
  if (!Number.isFinite(v)) return spec.def;
  return Math.min(spec.max, Math.max(spec.min, v));
}

// ------------------------------------------------------------------ texturas procedurales

function canvasTexture(THREE, size, draw, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(repeat, repeat);
  return t;
}

function noise(ctx, size, base, spread, count = 9000) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    const v = Math.floor(Math.random() * spread);
    ctx.fillStyle = `rgba(${v},${v},${v},0.06)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

const TEXTURES = {
  concreto: (ctx, s) => noise(ctx, s, '#bdbab3', 255, 14000),
  bloque: (ctx, s) => {
    noise(ctx, s, '#a2a3a0', 255, 9000);
    ctx.strokeStyle = 'rgba(60,60,60,.55)';
    ctx.lineWidth = 3;
    for (let r = 0; r < 4; r++) {
      const y = (r * s) / 4;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
      for (let c = 0; c < 2; c++) {
        const x = ((c + (r % 2) * 0.5) * s) / 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + s / 4); ctx.stroke();
      }
    }
  },
  ladrillo: (ctx, s) => {
    ctx.fillStyle = '#d8d2c6';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const h = s / rows;
    for (let r = 0; r < rows; r++) {
      const w = s / 3;
      for (let c = -1; c < 4; c++) {
        const x = c * w + (r % 2) * (w / 2);
        const tone = 150 + Math.floor(Math.random() * 40);
        ctx.fillStyle = `rgb(${tone + 20},${tone / 2 + 10},${tone / 3})`;
        ctx.fillRect(x + 2, r * h + 2, w - 4, h - 4);
      }
    }
  },
  madera: (ctx, s) => {
    ctx.fillStyle = '#9b6a3f';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = `rgba(${60 + Math.random() * 40},${35 + Math.random() * 20},15,0.22)`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      const y = Math.random() * s;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(s * 0.3, y + Math.random() * 8 - 4, s * 0.7, y + Math.random() * 8 - 4, s, y);
      ctx.stroke();
    }
  },
  teja: (ctx, s) => {
    ctx.fillStyle = '#8f4028';
    ctx.fillRect(0, 0, s, s);
    for (let r = 0; r < 8; r++) {
      const g = ctx.createLinearGradient(0, (r * s) / 8, 0, ((r + 1) * s) / 8);
      g.addColorStop(0, 'rgba(255,190,150,.18)');
      g.addColorStop(1, 'rgba(40,10,0,.35)');
      ctx.fillStyle = g;
      ctx.fillRect(0, (r * s) / 8, s, s / 8);
    }
  },
  pintura: (ctx, s) => noise(ctx, s, '#efece5', 255, 4000),
};

/** Materiales PBR compartidos (se crean una vez por escena). */
export function createMaterials(THREE) {
  const cache = {};
  const make = (key) => {
    const def = MATERIALS[key] || MATERIALS.concreto;
    if (key === 'vidrio') {
      return new THREE.MeshPhysicalMaterial({ color: def.color, metalness: 0, roughness: 0.04, transmission: 0.92, thickness: 0.02, ior: 1.5, transparent: true, opacity: 0.55, envMapIntensity: 1.4 });
    }
    if (key === 'acero') return new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.92, roughness: 0.32, envMapIntensity: 1.2 });
    const map = TEXTURES[key] ? canvasTexture(THREE, 256, TEXTURES[key]) : null;
    return new THREE.MeshStandardMaterial({ color: map ? 0xffffff : def.color, map, metalness: 0, roughness: key === 'madera' ? 0.65 : 0.88 });
  };
  return {
    get: (key) => (cache[key] ||= make(key)),
    frame: new THREE.MeshStandardMaterial({ color: 0x2b2f36, metalness: 0.6, roughness: 0.4 }),
    handle: new THREE.MeshStandardMaterial({ color: 0xc9c9c9, metalness: 1, roughness: 0.25 }),
    dispose: () => Object.values(cache).forEach((m) => { m.map?.dispose(); m.dispose(); }),
  };
}

// ------------------------------------------------------------------ geometría

/** Caja con su base en y = 0 y textura repetida según su tamaño real (≈ 1 repetición por metro). */
function box(THREE, w, h, d, material, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const ax = Math.abs(n.getX(i)); const ay = Math.abs(n.getY(i));
    const [su, sv] = ax > 0.5 ? [d, h] : ay > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/**
 * Puertas y ventanas que atraviesan un muro, en coordenadas del muro (x a lo largo, desde su centro).
 * Solo cuentan las que están en su plano (misma orientación y dentro del espesor).
 */
export function wallOpenings(wall, elements) {
  if (wall.type !== 'wall') return [];
  const rot = ((wall.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rot); const sin = Math.sin(rot);
  const T = num(wall, 'thickness');
  const out = [];
  for (const e of elements) {
    if (e.type !== 'door' && e.type !== 'window') continue;
    const sameAxis = Math.abs(Math.sin(((e.rotation || 0) - (wall.rotation || 0)) * Math.PI / 180)) < 0.05;
    if (!sameAxis) continue;
    const dx = e.position[0] - wall.position[0];
    const dz = e.position[2] - wall.position[2];
    const along = dx * cos - dz * sin;
    const across = dx * sin + dz * cos;
    if (Math.abs(across) > T / 2 + 0.1) continue;
    const base = e.position[1] - wall.position[1];
    const sill = e.type === 'window' ? num(e, 'sill') : 0;
    out.push({ x: along, width: num(e, 'width'), bottom: base + sill, height: num(e, 'height') });
  }
  return out;
}

/** Construye el objeto 3D de un elemento. El grupo resultante lleva userData.elementId. */
export function buildElement(THREE, el, mats, openings = null) {
  const group = new THREE.Group();
  const mat = mats.get(el.material);
  const add = (o) => { group.add(o); return o; };
  switch (el.type) {
    case 'column': {
      const height = num(el, 'height');
      if (el.params.shape === 'circular') {
        const r = num(el, 'b') / 2;
        const m = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, height, 32), mat));
        m.position.y = height / 2; m.castShadow = m.receiveShadow = true;
      } else add(box(THREE, num(el, 'b'), height, num(el, 'h'), mat));
      break;
    }
    case 'beam': {
      const b = num(el, 'b'), h = num(el, 'h'), L = num(el, 'length');
      if (el.params.profile === 'I') {
        const tf = Math.max(0.01, h * 0.08), tw = Math.max(0.008, b * 0.06);
        const s = new THREE.Shape();
        s.moveTo(-b / 2, 0); s.lineTo(b / 2, 0); s.lineTo(b / 2, tf); s.lineTo(tw / 2, tf); s.lineTo(tw / 2, h - tf);
        s.lineTo(b / 2, h - tf); s.lineTo(b / 2, h); s.lineTo(-b / 2, h); s.lineTo(-b / 2, h - tf); s.lineTo(-tw / 2, h - tf);
        s.lineTo(-tw / 2, tf); s.lineTo(-b / 2, tf); s.lineTo(-b / 2, 0);
        const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false });
        g.rotateY(Math.PI / 2); g.translate(-L / 2, 0, 0);
        const m = add(new THREE.Mesh(g, mat)); m.castShadow = m.receiveShadow = true;
      } else add(box(THREE, L, h, b, mat));
      break;
    }
    case 'slab': add(box(THREE, num(el, 'width'), num(el, 'thickness'), num(el, 'length'), mat)); break;
    case 'footing': add(box(THREE, num(el, 'width'), num(el, 'thickness'), num(el, 'length'), mat)); break;
    case 'wall': {
      const L = num(el, 'length'), H = num(el, 'height'), T = num(el, 'thickness');
      // Vanos (puertas y ventanas que cruzan el muro): el muro se arma por tramos alrededor de ellos.
      const holes = (openings || []).filter((o) => o.x + o.width / 2 > -L / 2 && o.x - o.width / 2 < L / 2)
        .map((o) => ({ a: Math.max(-L / 2, o.x - o.width / 2), b: Math.min(L / 2, o.x + o.width / 2), bottom: Math.max(0, o.bottom), top: Math.min(H, o.bottom + o.height) }))
        .sort((p, q) => p.a - q.a);
      let cursor = -L / 2;
      for (const h of holes) {
        if (h.a > cursor) add(box(THREE, h.a - cursor, H, T, mat, (cursor + h.a) / 2));
        const w = h.b - h.a;
        if (h.bottom > 0) add(box(THREE, w, h.bottom, T, mat, (h.a + h.b) / 2));
        if (h.top < H) add(box(THREE, w, H - h.top, T, mat, (h.a + h.b) / 2, h.top));
        cursor = Math.max(cursor, h.b);
      }
      if (cursor < L / 2) add(box(THREE, L / 2 - cursor, H, T, mat, (cursor + L / 2) / 2));
      break;
    }
    case 'door': {
      const w = num(el, 'width'), h = num(el, 'height'), d = num(el, 'depth'), f = 0.06;
      add(box(THREE, f, h, d, mats.frame, -w / 2 + f / 2));
      add(box(THREE, f, h, d, mats.frame, w / 2 - f / 2));
      add(box(THREE, w, f, d, mats.frame, 0, h - f));
      add(box(THREE, w - 2 * f, h - f, 0.045, mat, 0, 0, 0));
      const knob = add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), mats.handle));
      knob.position.set(w / 2 - 0.14, 1.05, 0.05);
      break;
    }
    case 'window': {
      const w = num(el, 'width'), h = num(el, 'height'), sill = num(el, 'sill'), d = num(el, 'depth'), f = 0.05;
      add(box(THREE, f, h, d, mats.frame, -w / 2 + f / 2, sill));
      add(box(THREE, f, h, d, mats.frame, w / 2 - f / 2, sill));
      add(box(THREE, w, f, d, mats.frame, 0, sill));
      add(box(THREE, w, f, d, mats.frame, 0, sill + h - f));
      add(box(THREE, f * 0.7, h - 2 * f, d * 0.6, mats.frame, 0, sill + f));
      const glass = add(box(THREE, w - 2 * f, h - 2 * f, 0.012, mats.get('vidrio'), 0, sill + f));
      glass.castShadow = false;
      add(box(THREE, w + 0.06, 0.03, d + 0.05, mats.get('concreto'), 0, sill - 0.03));
      break;
    }
    case 'stair': {
      const width = num(el, 'width'), steps = Math.round(num(el, 'steps')), r = num(el, 'riser'), t = num(el, 'tread');
      for (let i = 0; i < steps; i++) add(box(THREE, t, r * (i + 1), width, mat, i * t + t / 2, 0, 0));
      break;
    }
    case 'roof': {
      const W = num(el, 'width'), L = num(el, 'length'), th = num(el, 'thickness'), pitch = (num(el, 'pitch') * Math.PI) / 180;
      const half = W / 2;
      const slope = half / Math.cos(pitch);
      for (const side of [-1, 1]) {
        const plane = add(box(THREE, slope, th, L + 0.4, mat));
        plane.position.set((side * half) / 2, (half * Math.tan(pitch)) / 2, 0);
        plane.rotation.z = -side * pitch;
      }
      break;
    }
    default: break;
  }
  group.position.set(...(el.position || [0, 0, 0]));
  group.rotation.y = ((el.rotation || 0) * Math.PI) / 180;
  group.userData.elementId = el.id;
  group.traverse((o) => { if (o.isMesh) o.userData.elementId = el.id; });
  return group;
}

// ------------------------------------------------------------------ cantidades (igual que el backend)

export function quantities(elements) {
  const t = { concrete: 0, steel: 0, masonry: 0, glass: 0, wood: 0, roof: 0, doors: 0, windows: 0 };
  for (const el of elements) {
    const p = (k) => num(el, k);
    let q = 0;
    switch (el.type) {
      case 'column': q = (el.params.shape === 'circular' ? Math.PI * (p('b') / 2) ** 2 : p('b') * p('h')) * p('height'); break;
      case 'beam': q = p('b') * p('h') * p('length'); break;
      case 'slab': case 'footing': q = p('width') * p('length') * p('thickness'); break;
      case 'stair': q = (Math.hypot(p('steps') * p('riser'), (p('steps') - 1) * p('tread')) * 0.15 + (p('steps') * p('riser') * p('tread')) / 2) * p('width'); break;
      case 'wall': q = p('length') * p('height'); break;
      case 'roof': q = (p('width') * p('length')) / Math.cos((p('pitch') * Math.PI) / 180); break;
      case 'door': case 'window': q = p('width') * p('height'); break;
      default: break;
    }
    if (el.type === 'wall') { if (el.material === 'concreto') t.concrete += q * p('thickness'); else t.masonry += q; }
    else if (el.type === 'roof') t.roof += q;
    else if (el.type === 'door') t.doors += 1;
    else if (el.type === 'window') { t.windows += 1; t.glass += q; }
    else if (el.material === 'acero') t.steel += q * 7850;
    else if (el.material === 'madera') t.wood += q;
    else t.concrete += q;
  }
  return t;
}

/** Estructura de ejemplo para empezar: pórtico de 2 × 1 vanos con losa, muros, puerta, ventana y escalera. */
export function sampleModel() {
  const els = [];
  const H = 3;
  const xs = [0, 5, 10];
  const zs = [0, 4];
  for (const x of xs) for (const z of zs) {
    els.push({ ...createElement('footing', [x, -0.4, z]), params: { width: 1.6, length: 1.6, thickness: 0.4 } });
    els.push({ ...createElement('column', [x, 0, z]), params: { shape: 'rect', b: 0.4, h: 0.4, height: H } });
  }
  for (const z of zs) for (let i = 0; i < 2; i++) {
    els.push({ ...createElement('beam', [xs[i] + 2.5, H - 0.5, z]), params: { profile: 'rect', b: 0.3, h: 0.5, length: 5 } });
  }
  for (const x of xs) els.push({ ...createElement('beam', [x, H - 0.5, 2], 90), params: { profile: 'rect', b: 0.3, h: 0.5, length: 4 } });
  els.push({ ...createElement('slab', [5, H, 2]), params: { width: 10.4, length: 4.4, thickness: 0.15 } });
  // Fachada principal (z = 4, la que se ve primero) con puerta y ventanas; muro de bloque al fondo.
  els.push({ ...createElement('wall', [2.5, 0, 4]), params: { length: 4.6, height: 2.5, thickness: 0.15 } });
  els.push({ ...createElement('wall', [7.5, 0, 4]), params: { length: 4.6, height: 2.5, thickness: 0.15 } });
  els.push({ ...createElement('door', [1.4, 0, 4]) });
  els.push({ ...createElement('window', [3.4, 0, 4]), params: { width: 1.6, height: 1.2, sill: 0.9, depth: 0.15 } });
  els.push({ ...createElement('window', [7.5, 0, 4]), params: { width: 2.4, height: 1.3, sill: 0.9, depth: 0.15 } });
  els.push({ ...createElement('wall', [5, 0, 0]), material: 'bloque', params: { length: 9.6, height: 2.5, thickness: 0.15 } });
  els.push({ ...createElement('stair', [6.2, 0, 1.4]), params: { width: 1, steps: 17, riser: 0.176, tread: 0.22 } });
  els.push({ ...createElement('roof', [5, 3.15, 2]), params: { width: 4.8, length: 10.6, pitch: 18, thickness: 0.12 }, rotation: 90 });
  return { version: 1, elements: els };
}
