// Mobiliario y equipamiento interior del modelador: cocina, baño, dormitorio, sala y comedor e
// iluminación. Cada pieza es paramétrica (medidas reales en metros), con su frente hacia +Z y la base
// en el piso del elemento. No suma cantidades de obra (el backend también lo omite del presupuesto),
// pero se exporta a IFC con su clase: IfcFurniture, IfcSanitaryTerminal o IfcLightFixture.

const P = (label, unit, def, min, max, step = 0.01) => ({ label, unit, def, min, max, step });
const opt = (label, options, def) => ({ label, options, def });
const type = (label, icon, category, materials, params) => ({ label, icon, category, materials, material: materials[0], params });
const YES_NO = { si: 'Sí', no: 'No' };

export const FURNITURE_CATEGORIES = ['Cocina', 'Baño', 'Dormitorio', 'Sala y comedor', 'Iluminación'];

export const FURNITURE_TYPES = {
  // ------------------------------------------------------------------ cocina
  kitchen_base: type('Mueble bajo de cocina', 'kitchen', 'Cocina', ['laca', 'madera', 'aluminio'], {
    length: P('Longitud', 'm', 2.4, 0.4, 8, 0.05), depth: P('Fondo', 'm', 0.6, 0.45, 0.8, 0.01), height: P('Altura', 'm', 0.9, 0.8, 1, 0.01),
    sink: opt('Lavaplatos', { no: 'Sin lavaplatos', simple: 'Sencillo', doble: 'Doble' }, 'simple'), cooktop: opt('Cubierta de cocción', YES_NO, 'si'),
  }),
  kitchen_upper: type('Alacena', 'kitchen', 'Cocina', ['laca', 'madera', 'aluminio'], {
    length: P('Longitud', 'm', 2.4, 0.4, 8, 0.05), height: P('Altura', 'm', 0.7, 0.4, 1.2, 0.01), depth: P('Fondo', 'm', 0.35, 0.25, 0.5, 0.01), elevation: P('Altura de instalación', 'm', 1.45, 1.2, 2, 0.01),
  }),
  kitchen_island: type('Isla de cocina con barra', 'kitchen', 'Cocina', ['laca', 'madera', 'piedra'], {
    length: P('Longitud', 'm', 2.4, 1.2, 5, 0.05), width: P('Ancho', 'm', 1, 0.7, 1.6, 0.05), height: P('Altura', 'm', 0.92, 0.85, 1.1, 0.01), stools: P('Bancos', '', 3, 0, 6, 1),
  }),
  fridge: type('Nevera', 'fridge', 'Cocina', ['aluminio', 'laca'], {
    width: P('Ancho', 'm', 0.75, 0.55, 1.2, 0.01), depth: P('Fondo', 'm', 0.7, 0.55, 0.85, 0.01), height: P('Altura', 'm', 1.85, 1.4, 2.1, 0.01),
  }),
  range: type('Estufa con horno', 'stove', 'Cocina', ['aluminio', 'laca'], {
    width: P('Ancho', 'm', 0.76, 0.5, 1.2, 0.01), depth: P('Fondo', 'm', 0.65, 0.55, 0.75, 0.01), height: P('Altura', 'm', 0.9, 0.85, 0.95, 0.01),
  }),

  // ------------------------------------------------------------------ baño
  toilet: type('Sanitario', 'toilet', 'Baño', ['ceramica'], {}),
  washbasin: type('Lavamanos con mueble y espejo', 'sink', 'Baño', ['madera', 'laca', 'ceramica'], {
    width: P('Ancho', 'm', 0.8, 0.45, 1.8, 0.05), mirror: opt('Espejo', YES_NO, 'si'),
  }),
  shower: type('Ducha con división de vidrio', 'shower', 'Baño', ['ceramica', 'piedra'], {
    width: P('Ancho', 'm', 0.9, 0.7, 1.8, 0.05), length: P('Largo', 'm', 0.9, 0.7, 1.8, 0.05), height: P('Altura de la división', 'm', 2, 1.8, 2.4, 0.05),
  }),
  bathtub: type('Tina', 'bath', 'Baño', ['ceramica'], {
    length: P('Largo', 'm', 1.7, 1.4, 2, 0.05), width: P('Ancho', 'm', 0.75, 0.65, 1, 0.05),
  }),

  // ------------------------------------------------------------------ dormitorio
  bed: type('Cama', 'bed', 'Dormitorio', ['madera', 'tela', 'laca'], {
    size: opt('Tamaño', { sencilla: 'Sencilla (0,90 × 1,90)', doble: 'Doble (1,40 × 1,90)', queen: 'Queen (1,60 × 2,00)', king: 'King (2,00 × 2,00)' }, 'queen'),
    headboard: P('Altura del cabecero', 'm', 1.1, 0.8, 1.6, 0.05),
  }),
  nightstand: type('Mesa de noche', 'drawer', 'Dormitorio', ['madera', 'laca'], {
    width: P('Ancho', 'm', 0.5, 0.35, 0.8, 0.01), lamp: opt('Lámpara', YES_NO, 'si'),
  }),
  wardrobe: type('Clóset', 'wardrobe', 'Dormitorio', ['madera', 'laca'], {
    width: P('Ancho', 'm', 1.8, 0.6, 4, 0.05), height: P('Altura', 'm', 2.3, 1.8, 2.7, 0.05), depth: P('Fondo', 'm', 0.6, 0.45, 0.7, 0.01),
  }),
  desk: type('Escritorio con silla', 'desk', 'Dormitorio', ['madera', 'laca'], {
    width: P('Ancho', 'm', 1.2, 0.8, 2, 0.05), depth: P('Fondo', 'm', 0.6, 0.45, 0.8, 0.01),
  }),

  // ------------------------------------------------------------------ sala y comedor
  sofa: type('Sofá', 'sofa', 'Sala y comedor', ['tela', 'cuero'], {
    width: P('Ancho', 'm', 2.2, 1.4, 3.6, 0.05), depth: P('Fondo', 'm', 0.92, 0.8, 1.1, 0.01),
  }),
  armchair: type('Poltrona', 'sofa', 'Sala y comedor', ['tela', 'cuero'], {}),
  coffee_table: type('Mesa de centro', 'table', 'Sala y comedor', ['madera', 'piedra', 'vidrio'], {
    width: P('Largo', 'm', 1.2, 0.6, 2, 0.05), depth: P('Ancho', 'm', 0.6, 0.4, 1.2, 0.05), height: P('Altura', 'm', 0.4, 0.3, 0.5, 0.01),
  }),
  dining_table: type('Comedor', 'table', 'Sala y comedor', ['madera', 'piedra', 'vidrio'], {
    length: P('Largo', 'm', 1.8, 0.8, 3.6, 0.05), width: P('Ancho', 'm', 0.95, 0.7, 1.4, 0.05), seats: P('Sillas', '', 6, 0, 12, 1),
  }),
  tv_unit: type('Mueble de TV con televisor', 'tv', 'Sala y comedor', ['madera', 'laca'], {
    length: P('Largo del mueble', 'm', 1.8, 1, 3.6, 0.05), screen: P('Pantalla', '"', 55, 32, 85, 1),
  }),
  bookshelf: type('Biblioteca', 'shelf', 'Sala y comedor', ['madera', 'laca', 'acero'], {
    width: P('Ancho', 'm', 1, 0.5, 3, 0.05), height: P('Altura', 'm', 2, 1, 2.6, 0.05), shelves: P('Entrepaños', '', 5, 2, 8, 1),
  }),
  rug: type('Tapete', 'rug', 'Sala y comedor', ['tela'], {
    width: P('Ancho', 'm', 2.4, 0.8, 5, 0.05), length: P('Largo', 'm', 1.7, 0.6, 4, 0.05),
  }),
  indoor_plant: type('Planta de interior', 'plant', 'Sala y comedor', ['ceramica', 'piedra'], {
    height: P('Altura', 'm', 1.2, 0.4, 2.2, 0.05),
  }),

  // ------------------------------------------------------------------ iluminación
  pendant_lamp: type('Lámpara colgante', 'lamp', 'Iluminación', ['acero', 'aluminio', 'madera'], {
    ceiling: P('Altura del techo', 'm', 2.6, 2.2, 6, 0.05), drop: P('Descuelgue', 'm', 0.8, 0.2, 3, 0.05), diameter: P('Diámetro', 'm', 0.4, 0.15, 1.2, 0.01),
  }),
  floor_lamp: type('Lámpara de pie', 'lamp', 'Iluminación', ['acero', 'aluminio', 'madera'], {
    height: P('Altura', 'm', 1.6, 1.2, 2, 0.05),
  }),
  table_lamp: type('Lámpara de mesa', 'lamp', 'Iluminación', ['ceramica', 'acero', 'madera'], {
    elevation: P('Altura de la mesa', 'm', 0.75, 0, 1.2, 0.01),
  }),
};

export const FURNITURE_IFC = {
  toilet: 'IFCSANITARYTERMINAL', washbasin: 'IFCSANITARYTERMINAL', shower: 'IFCSANITARYTERMINAL', bathtub: 'IFCSANITARYTERMINAL',
  pendant_lamp: 'IFCLIGHTFIXTURE', floor_lamp: 'IFCLIGHTFIXTURE', table_lamp: 'IFCLIGHTFIXTURE',
};
Object.keys(FURNITURE_TYPES).forEach((k) => { FURNITURE_IFC[k] ||= 'IFCFURNITURE'; });

// ------------------------------------------------------------------ materiales auxiliares

const extrasCache = new WeakMap();
/** Materiales de acabado de los muebles (porcelana, cromo, colchón, vidrio, pantalla…), uno por escena. */
function extras(T, mats) {
  if (extrasCache.has(mats)) return extrasCache.get(mats);
  const std = (color, roughness, metalness = 0, extra = {}) => new T.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const x = {
    porcelain: new T.MeshPhysicalMaterial({ color: 0xf6f5f1, roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.08 }),
    chrome: std(0xe8eaed, 0.08, 1),
    brushed: std(0xc3c7cc, 0.32, 0.9),
    black: std(0x17181b, 0.55, 0.2),
    blackGlass: new T.MeshPhysicalMaterial({ color: 0x0b0c0e, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 }),
    marble: mats.get('marmol'),
    mattress: std(0xf2f0eb, 0.95),
    linen: std(0xe8e2d6, 0.95),
    throw: std(0x5b6b5a, 0.95),
    pillow: std(0xfafaf7, 0.95),
    cushion: std(0x8c8f92, 0.95),
    clearGlass: new T.MeshPhysicalMaterial({ color: 0xe9f2f5, roughness: 0.02, transmission: 0.95, thickness: 0.01, transparent: true, opacity: 0.28, ior: 1.5 }),
    mirror: std(0xdfe5ea, 0.02, 1),
    screen: new T.MeshPhysicalMaterial({ color: 0x050607, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.02 }),
    shadeIn: std(0xfff1d6, 0.9, 0, { emissive: 0xffd9a0, emissiveIntensity: 0.9, side: T.DoubleSide }),
    bulb: std(0xffffff, 0.3, 0, { emissive: 0xffe2b0, emissiveIntensity: 3 }),
    led: std(0xffffff, 0.4, 0, { emissive: 0xfff0d8, emissiveIntensity: 1.6 }),
    leaf: [std(0x2f5a2e, 0.8), std(0x3c6e36, 0.8), std(0x4c7d3d, 0.8)],
    soil: std(0x3a2c22, 1),
    book: [0x7a2e2a, 0x2f4a6d, 0xd9cfbd, 0x3f5b46, 0x1f2329, 0xb58a4c, 0x6b5b7b].map((c) => std(c, 0.8)),
    rugBorder: std(0x3b3833, 0.98),
  };
  extrasCache.set(mats, x);
  return x;
}

// ------------------------------------------------------------------ geometría

function soft(m) { m.castShadow = true; m.receiveShadow = true; return m; }

/** Caja de esquinas redondeadas (cojines, colchones, porcelana) con la base en y. */
function rbox(T, w, h, d, r, material, x = 0, y = 0, z = 0) {
  const b = Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002);
  const iw = w - 2 * b; const ih = h - 2 * b;
  const s = new T.Shape();
  s.moveTo(-iw / 2, -ih / 2); s.lineTo(iw / 2, -ih / 2); s.lineTo(iw / 2, ih / 2); s.lineTo(-iw / 2, ih / 2); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  g.computeVertexNormals();
  const m = soft(new T.Mesh(g, material));
  m.position.set(x, y + h / 2, z);
  return m;
}

/** Cilindro (o tronco de cono) con la base en y. */
function cyl(T, rTop, rBottom, h, material, x = 0, y = 0, z = 0, seg = 28, open = false) {
  const m = soft(new T.Mesh(new T.CylinderGeometry(rTop, rBottom, h, seg, 1, open), material));
  m.position.set(x, y + h / 2, z);
  return m;
}

/** Grifo: columna y caño curvo cromados, con la salida hacia +Z. */
function faucet(T, add, X, x, y, z, reach = 0.16) {
  add(cyl(T, 0.016, 0.02, 0.24, X.chrome, x, y, z));
  const arc = new T.Mesh(new T.TorusGeometry(reach / 2, 0.012, 10, 24, Math.PI), X.chrome);
  arc.rotation.y = -Math.PI / 2;
  arc.position.set(x, y + 0.24, z + reach / 2);
  add(soft(arc));
  add(cyl(T, 0.004, 0.012, 0.03, X.chrome, x, y + 0.08, z - 0.05));
}

/** Silla de comedor: patas, asiento tapizado y respaldo. */
function chair(T, add, box, mat, X, x, z, rot) {
  const g = new T.Group();
  const local = (o) => { g.add(o); return o; };
  const lb = (...a) => local(box(...a));
  for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) lb(0.035, 0.45, 0.035, mat, lx, 0, lz);
  local(rbox(T, 0.46, 0.06, 0.46, 0.02, X.cushion, 0, 0.45, 0));
  lb(0.035, 0.45, 0.035, mat, -0.2, 0.45, -0.2);
  lb(0.035, 0.45, 0.035, mat, 0.2, 0.45, -0.2);
  local(rbox(T, 0.44, 0.26, 0.04, 0.015, mat, 0, 0.62, -0.21));
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  add(g);
}

/** Bombillo con luz real para las lámparas (sin sombras, para no cargar la escena). */
function glow(T, add, X, x, y, z, intensity = 4) {
  const b = new T.Mesh(new T.SphereGeometry(0.035, 14, 10), X.bulb);
  b.position.set(x, y, z);
  add(b);
  const light = new T.PointLight(0xffd9a8, intensity, 7, 2);
  light.position.set(x, y, z);
  add(light);
}

/** Construye un mueble. Devuelve false si el tipo no es de este módulo. */
export function buildFurniture(T, el, mats, mat, add, box, n) {
  if (!FURNITURE_TYPES[el.type]) return false;
  const X = extras(T, mats);
  const mk = (...a) => box(T, ...a);
  const B = (...a) => add(mk(...a));
  const o = (key, def) => (el.params?.[key] in (FURNITURE_TYPES[el.type].params[key]?.options || {}) ? el.params[key] : def);
  switch (el.type) {
    case 'kitchen_base': {
      const L = n('length'); const D = n('depth'); const H = n('height'); const top = 0.04;
      B(L - 0.02, 0.1, D - 0.08, X.black, 0, 0, -0.04); // zócalo retrocedido
      B(L, H - 0.1 - top, D - 0.02, mat, 0, 0.1, -0.01);
      const mods = Math.max(1, Math.round(L / 0.6));
      for (let i = 1; i < mods; i++) B(0.004, H - 0.1 - top - 0.02, 0.004, X.black, -L / 2 + (i * L) / mods, 0.11, D / 2 - 0.018);
      B(L, 0.004, 0.004, X.black, 0, H - top - 0.2, D / 2 - 0.018); // cajonera superior
      for (let i = 0; i < mods; i++) B(Math.min(0.32, L / mods - 0.12), 0.012, 0.02, X.brushed, -L / 2 + ((i + 0.5) * L) / mods, H - top - 0.13, D / 2);
      B(L + 0.02, top, D + 0.02, X.marble, 0, H - top, 0);
      const sink = o('sink', 'simple');
      if (sink !== 'no') {
        const bowls = sink === 'doble' ? 2 : 1; const sw = 0.45;
        const sx = -L / 2 + Math.min(L * 0.3, 0.6 + (bowls * sw) / 2);
        for (let k = 0; k < bowls; k++) B(sw - 0.04, 0.012, D * 0.62, X.brushed, sx + (k - (bowls - 1) / 2) * sw, H - 0.008, -0.02);
        faucet(T, add, X, sx, H, -D / 2 + 0.12, 0.2);
      }
      if (o('cooktop', 'si') === 'si' && L >= 1.2) {
        const cx = L / 2 - Math.min(L * 0.3, 0.55);
        B(0.6, 0.008, 0.5, X.blackGlass, cx, H, 0);
        for (const [dx, dz, r] of [[-0.15, -0.11, 0.09], [0.15, -0.11, 0.07], [-0.15, 0.12, 0.07], [0.15, 0.12, 0.09]]) {
          const ring = new T.Mesh(new T.TorusGeometry(r, 0.004, 6, 32), X.brushed);
          ring.rotation.x = Math.PI / 2;
          ring.position.set(cx + dx, H + 0.009, dz);
          add(ring);
        }
      }
      return true;
    }
    case 'kitchen_upper': {
      const L = n('length'); const H = n('height'); const D = n('depth'); const Y = n('elevation');
      B(L, H, D, mat, 0, Y, 0);
      const mods = Math.max(1, Math.round(L / 0.6));
      for (let i = 1; i < mods; i++) B(0.004, H - 0.02, 0.004, X.black, -L / 2 + (i * L) / mods, Y + 0.01, D / 2 + 0.001);
      for (let i = 0; i < mods; i++) B(Math.min(0.3, L / mods - 0.14), 0.012, 0.02, X.brushed, -L / 2 + ((i + 0.5) * L) / mods, Y + 0.05, D / 2 + 0.01);
      B(L - 0.04, 0.012, 0.03, X.led, 0, Y - 0.012, D / 2 - 0.06); // cinta led bajo la alacena
      return true;
    }
    case 'kitchen_island': {
      const L = n('length'); const W = n('width'); const H = n('height'); const over = 0.3;
      B(L - 0.04, 0.1, W - over - 0.08, X.black, 0, 0, -over / 2);
      B(L, H - 0.14, W - over, mat, 0, 0.1, -over / 2);
      B(L + 0.04, 0.04, W, X.marble, 0, H - 0.04, 0);
      const stools = Math.round(n('stools'));
      for (let i = 0; i < stools; i++) {
        const x = -L / 2 + ((i + 0.5) * L) / stools; const z = W / 2 + 0.12;
        add(cyl(T, 0.18, 0.2, 0.012, X.black, x, 0, z));
        add(cyl(T, 0.02, 0.02, 0.62, X.brushed, x, 0, z));
        const ring = new T.Mesh(new T.TorusGeometry(0.15, 0.01, 8, 32), X.brushed); // aro reposapiés
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, 0.3, z);
        add(soft(ring));
        add(rbox(T, 0.38, 0.06, 0.36, 0.025, X.cushion, x, 0.62, z));
      }
      return true;
    }
    case 'fridge': {
      const W = n('width'); const D = n('depth'); const H = n('height');
      add(rbox(T, W, H, D, 0.02, mat, 0, 0, 0));
      B(W - 0.02, 0.006, 0.006, X.black, 0, H * 0.62, D / 2 + 0.001);
      for (const [y0, h] of [[H * 0.66, H * 0.26], [H * 0.12, H * 0.42]]) B(0.022, h, 0.03, X.brushed, W / 2 - 0.07, y0, D / 2 + 0.03);
      return true;
    }
    case 'range': {
      const W = n('width'); const D = n('depth'); const H = n('height');
      B(W, H - 0.02, D, mat, 0, 0, 0);
      B(W - 0.08, H * 0.48, 0.01, X.blackGlass, 0, 0.12, D / 2 + 0.001);
      B(W - 0.16, 0.02, 0.03, X.brushed, 0, H * 0.66, D / 2 + 0.02);
      B(W, 0.012, D, X.blackGlass, 0, H - 0.02, 0);
      for (const [dx, dz, r] of [[-0.18, -0.13, 0.09], [0.18, -0.13, 0.07], [-0.18, 0.12, 0.07], [0.18, 0.12, 0.09]]) {
        add(cyl(T, r, r, 0.02, X.black, dx * (W / 0.76), H - 0.008, dz));
        add(cyl(T, r * 0.45, r * 0.45, 0.025, X.brushed, dx * (W / 0.76), H - 0.008, dz));
      }
      for (let i = 0; i < 4; i++) add(cyl(T, 0.022, 0.022, 0.03, X.brushed, -W / 2 + 0.12 + i * ((W - 0.24) / 3), H - 0.12, D / 2)).rotation.x = Math.PI / 2;
      return true;
    }
    case 'toilet': {
      const lathe = new T.LatheGeometry([[0.0, 0], [0.13, 0], [0.12, 0.2], [0.17, 0.36], [0.19, 0.4], [0.16, 0.41], [0.0, 0.41]].map(([x, y]) => new T.Vector2(x, y)), 32);
      lathe.scale(1, 1, 1.32);
      const bowl = soft(new T.Mesh(lathe, X.porcelain));
      bowl.position.z = 0.06;
      add(bowl);
      const seat = soft(new T.Mesh(new T.TorusGeometry(0.155, 0.022, 10, 36), X.porcelain));
      seat.rotation.x = Math.PI / 2;
      seat.scale.set(1, 1.3, 1);
      seat.position.set(0, 0.425, 0.08);
      add(seat);
      add(rbox(T, 0.38, 0.36, 0.17, 0.03, X.porcelain, 0, 0.42, -0.2));
      add(cyl(T, 0.02, 0.02, 0.012, X.chrome, 0, 0.78, -0.2));
      return true;
    }
    case 'washbasin': {
      const W = n('width');
      B(W, 0.42, 0.46, mat, 0, 0.42, 0);
      B(W - 0.02, 0.004, 0.004, X.black, 0, 0.62, 0.231);
      add(rbox(T, W + 0.02, 0.06, 0.48, 0.02, X.porcelain, 0, 0.84, 0.01));
      const basin = soft(new T.Mesh(new T.CylinderGeometry(0.17, 0.15, 0.012, 32), X.brushed));
      basin.scale.set(Math.min(1.4, W / 0.5), 1, 1);
      basin.position.set(0, 0.895, 0.04);
      add(basin);
      faucet(T, add, X, 0, 0.9, -0.17, 0.14);
      if (o('mirror', 'si') === 'si') {
        B(W, 0.8, 0.02, X.mirror, 0, 1.05, -0.24);
        B(W - 0.1, 0.012, 0.02, X.led, 0, 1.86, -0.23);
      }
      return true;
    }
    case 'shower': {
      const W = n('width'); const L = n('length'); const H = n('height');
      add(rbox(T, W, 0.05, L, 0.015, X.porcelain, 0, 0, 0));
      add(cyl(T, 0.04, 0.04, 0.004, X.brushed, 0, 0.05, 0));
      const g1 = B(0.01, H, L, X.clearGlass, W / 2, 0.05, 0); g1.castShadow = false;
      const g2 = B(W * 0.55, H, 0.01, X.clearGlass, W / 2 - W * 0.275, 0.05, L / 2); g2.castShadow = false;
      B(0.025, H, 0.025, X.chrome, W / 2, 0.05, L / 2);
      add(cyl(T, 0.012, 0.012, 2.05, X.chrome, -W / 2 + 0.06, 0, -L / 2 + 0.05));
      const arm = B(0.02, 0.02, 0.32, X.chrome, -W / 2 + 0.06, 2.05, -L / 2 + 0.2);
      arm.castShadow = false;
      add(cyl(T, 0.12, 0.12, 0.012, X.chrome, -W / 2 + 0.06, 2.03, -L / 2 + 0.34));
      B(0.08, 0.16, 0.05, X.chrome, -W / 2 + 0.06, 1.0, -L / 2 + 0.03);
      return true;
    }
    case 'bathtub': {
      const L = n('length'); const W = n('width');
      add(rbox(T, L, 0.56, W, 0.08, X.porcelain, 0, 0, 0));
      add(rbox(T, L - 0.14, 0.04, W - 0.14, 0.06, X.clearGlass, 0, 0.46, 0));
      faucet(T, add, X, -L / 2 + 0.1, 0.56, 0, 0.16);
      return true;
    }
    case 'bed': {
      const sizes = { sencilla: [0.9, 1.9], doble: [1.4, 1.9], queen: [1.6, 2], king: [2, 2] };
      const [W, Lb] = sizes[o('size', 'queen')];
      const HB = n('headboard');
      B(W + 0.08, 0.28, Lb + 0.05, mat, 0, 0.06, 0);
      for (const [x, z] of [[-W / 2, -Lb / 2], [W / 2, -Lb / 2], [-W / 2, Lb / 2], [W / 2, Lb / 2]]) B(0.05, 0.06, 0.05, X.black, x * 0.92, 0, z * 0.95);
      add(rbox(T, W + 0.2, HB, 0.1, 0.03, el.material === 'tela' ? mat : X.cushion, 0, 0.06, -Lb / 2 - 0.05));
      add(rbox(T, W - 0.02, 0.22, Lb - 0.04, 0.05, X.mattress, 0, 0.34, 0.01));
      add(rbox(T, W + 0.06, 0.08, Lb * 0.66, 0.035, X.linen, 0, 0.53, Lb * 0.17)); // edredón
      add(rbox(T, W + 0.08, 0.035, 0.42, 0.015, X.throw, 0, 0.6, Lb * 0.34)); // pie de cama
      const pillows = W >= 1.2 ? 2 : 1;
      for (let i = 0; i < pillows; i++) {
        const px = pillows === 1 ? 0 : (i - 0.5) * (W / 2);
        const pw = W / pillows - 0.12;
        const pl = add(rbox(T, pw, 0.14, 0.42, 0.06, X.pillow, px, 0.54, -Lb / 2 + 0.3));
        pl.rotation.x = -0.25;
      }
      return true;
    }
    case 'nightstand': {
      const W = n('width');
      B(W, 0.5, 0.4, mat, 0, 0.06, 0);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(0.03, 0.06, 0.03, X.black, (x * W) / 2.3, 0, z * 0.16);
      B(W - 0.04, 0.004, 0.004, X.black, 0, 0.36, 0.201);
      B(0.12, 0.012, 0.02, X.brushed, 0, 0.44, 0.21);
      if (o('lamp', 'si') === 'si') {
        add(cyl(T, 0.05, 0.07, 0.24, X.porcelain, 0, 0.56, -0.04));
        add(cyl(T, 0.12, 0.15, 0.2, X.shadeIn, 0, 0.78, -0.04, 28, true));
        glow(T, add, X, 0, 0.85, -0.04, 2);
      }
      return true;
    }
    case 'wardrobe': {
      const W = n('width'); const H = n('height'); const D = n('depth');
      B(W, H, D, mat, 0, 0, 0);
      const doors = Math.max(1, Math.round(W / 0.6));
      for (let i = 1; i < doors; i++) B(0.004, H - 0.04, 0.004, X.black, -W / 2 + (i * W) / doors, 0.02, D / 2 + 0.001);
      for (let i = 0; i < doors; i++) {
        const right = i % 2 === 0;
        const x = -W / 2 + ((i + (right ? 1 : 0)) * W) / doors + (right ? -0.05 : 0.05);
        B(0.016, 0.4, 0.025, X.brushed, x, H * 0.45, D / 2 + 0.012);
      }
      return true;
    }
    case 'desk': {
      const W = n('width'); const D = n('depth');
      B(W, 0.03, D, mat, 0, 0.72, 0);
      for (const sx of [-1, 1]) B(0.04, 0.72, D - 0.06, X.black, (sx * (W - 0.06)) / 2, 0, 0);
      B(W * 0.55, 0.32, 0.02, X.screen, 0, 0.84, -D / 2 + 0.12); // monitor
      B(0.04, 0.12, 0.04, X.black, 0, 0.75, -D / 2 + 0.1);
      // Silla de oficina: base de cinco radios, columna, asiento y respaldo.
      const cz = D / 2 + 0.25;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const leg = B(0.3, 0.025, 0.03, X.black, Math.cos(a) * 0.14, 0.04, cz + Math.sin(a) * 0.14);
        leg.rotation.y = -a;
      }
      add(cyl(T, 0.025, 0.025, 0.4, X.brushed, 0, 0.05, cz));
      add(rbox(T, 0.48, 0.07, 0.46, 0.03, X.cushion, 0, 0.45, cz));
      const back = add(rbox(T, 0.44, 0.5, 0.06, 0.03, X.cushion, 0, 0.56, cz + 0.24));
      back.rotation.x = -0.12;
      return true;
    }
    case 'sofa':
    case 'armchair': {
      const W = el.type === 'sofa' ? n('width') : 0.85; const D = el.type === 'sofa' ? n('depth') : 0.85;
      const arm = 0.16; const seats = el.type === 'sofa' ? Math.max(2, Math.round((W - 2 * arm) / 0.65)) : 1;
      const inner = W - 2 * arm; const sw = inner / seats;
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(0.04, 0.1, 0.04, X.black, x * (W / 2 - 0.08), 0, z * (D / 2 - 0.08));
      add(rbox(T, W, 0.22, D, 0.04, mat, 0, 0.1, 0)); // base
      for (const sx of [-1, 1]) add(rbox(T, arm, 0.36, D, 0.05, mat, sx * (W / 2 - arm / 2), 0.28, 0));
      add(rbox(T, inner, 0.42, 0.2, 0.06, mat, 0, 0.28, -D / 2 + 0.1)); // respaldo
      for (let i = 0; i < seats; i++) {
        const x = -inner / 2 + sw * (i + 0.5);
        add(rbox(T, sw - 0.01, 0.16, D - 0.24, 0.06, mat, x, 0.3, 0.1)); // cojín de asiento
        const back = add(rbox(T, sw - 0.03, 0.42, 0.16, 0.07, mat, x, 0.44, -D / 2 + 0.26)); // cojín de espalda
        back.rotation.x = -0.14;
      }
      if (el.type === 'sofa') add(rbox(T, 0.42, 0.4, 0.14, 0.07, X.throw, -inner / 2 + 0.28, 0.44, -D / 2 + 0.36)).rotation.set(-0.2, 0.25, 0.1);
      return true;
    }
    case 'coffee_table': {
      const W = n('width'); const D = n('depth'); const H = n('height');
      const glass = el.material === 'vidrio';
      const top = B(W, 0.03, D, glass ? X.clearGlass : mat, 0, H - 0.03, 0);
      top.castShadow = !glass;
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(0.03, H - 0.03, 0.03, X.black, x * (W / 2 - 0.06), 0, z * (D / 2 - 0.06));
      B(W - 0.1, 0.02, D - 0.1, X.black, 0, 0.1, 0);
      add(cyl(T, 0.06, 0.05, 0.1, X.porcelain, W * 0.22, H, 0)); // florero
      for (let i = 0; i < 2; i++) B(0.24, 0.03, 0.18, X.book[i + 1], -W * 0.2, H + i * 0.03, 0.02 * i);
      return true;
    }
    case 'dining_table': {
      const L = n('length'); const W = n('width'); const seats = Math.round(n('seats'));
      B(L, 0.04, W, mat, 0, 0.72, 0);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(0.06, 0.72, 0.06, X.black, x * (L / 2 - 0.1), 0, z * (W / 2 - 0.1));
      const side = Math.ceil(Math.max(0, seats - (seats > 4 ? 2 : 0)) / 2);
      let placed = 0;
      for (let i = 0; i < side && placed < seats; i++) {
        const x = -L / 2 + ((i + 0.5) * L) / side;
        chair(T, add, mk, X.black, X, x, W / 2 + 0.25, Math.PI); placed++;
        if (placed < seats) { chair(T, add, mk, X.black, X, x, -W / 2 - 0.25, 0); placed++; }
      }
      if (placed < seats) { chair(T, add, mk, X.black, X, L / 2 + 0.3, 0, -Math.PI / 2); placed++; }
      if (placed < seats) chair(T, add, mk, X.black, X, -L / 2 - 0.3, 0, Math.PI / 2);
      return true;
    }
    case 'tv_unit': {
      const L = n('length'); const inch = n('screen');
      const diag = inch * 0.0254; const sw = diag * 0.8716; const sh = diag * 0.4903;
      B(L, 0.4, 0.42, mat, 0, 0.08, 0);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(0.03, 0.08, 0.03, X.black, x * (L / 2 - 0.08), 0, z * 0.16);
      const doors = Math.max(2, Math.round(L / 0.6));
      for (let i = 1; i < doors; i++) B(0.004, 0.38, 0.004, X.black, -L / 2 + (i * L) / doors, 0.09, 0.211);
      B(sw + 0.012, sh + 0.012, 0.03, X.black, 0, 0.62, -0.12);
      B(sw, sh, 0.004, X.screen, 0, 0.626, -0.103);
      B(0.3, 0.14, 0.02, X.black, 0, 0.48, -0.12);
      B(0.4, 0.06, 0.08, X.black, 0, 0.48, 0.05); // barra de sonido
      return true;
    }
    case 'bookshelf': {
      const W = n('width'); const H = n('height'); const S = Math.round(n('shelves')); const D = 0.32;
      for (const sx of [-1, 1]) B(0.025, H, D, mat, sx * (W / 2 - 0.0125), 0, 0);
      B(W, H, 0.012, mat, 0, 0, -D / 2 + 0.006);
      const gap = H / S;
      let seed = (Math.round(W * 100) * 31 + S * 7) >>> 0;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let k = 0; k <= S; k++) {
        const y = Math.min(H - 0.025, k * gap);
        B(W - 0.05, 0.025, D - 0.01, mat, 0, y, 0);
        if (k === S) continue;
        let x = -W / 2 + 0.04;
        while (x < W / 2 - 0.12 && rnd() < 0.93) {
          const bw = 0.025 + rnd() * 0.035; const bh = Math.min(gap - 0.06, 0.18 + rnd() * 0.12);
          if (rnd() < 0.12) { x += 0.08; continue; }
          const b = B(bw, bh, 0.2 + rnd() * 0.06, X.book[Math.floor(rnd() * X.book.length)], x + bw / 2, y + 0.025, 0.02);
          b.castShadow = false;
          x += bw + 0.002;
        }
      }
      return true;
    }
    case 'rug': {
      const W = n('width'); const L = n('length');
      B(W, 0.012, L, mat, 0, 0, 0).castShadow = false;
      for (const [w, d, x, z] of [[W - 0.16, 0.04, 0, L / 2 - 0.1], [W - 0.16, 0.04, 0, -L / 2 + 0.1], [0.04, L - 0.16, W / 2 - 0.1, 0], [0.04, L - 0.16, -W / 2 + 0.1, 0]]) {
        B(w, 0.0125, d, X.rugBorder, x, 0.0005, z).castShadow = false;
      }
      return true;
    }
    case 'indoor_plant': {
      const H = n('height'); const potH = Math.min(0.45, H * 0.32); const potR = Math.min(0.24, 0.1 + H * 0.08);
      add(cyl(T, potR, potR * 0.78, potH, mat, 0, 0, 0, 28));
      add(cyl(T, potR * 0.92, potR * 0.92, 0.02, X.soil, 0, potH - 0.03, 0));
      const stems = 7 + Math.round(H * 4);
      let seed = Math.round(H * 1000) >>> 0;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let i = 0; i < stems; i++) {
        const a = (i / stems) * Math.PI * 2 + rnd() * 0.5; const lean = 0.25 + rnd() * 0.45;
        const len = (H - potH) * (0.6 + rnd() * 0.45);
        const stem = add(cyl(T, 0.006, 0.01, len, X.leaf[0], 0, potH, 0, 6));
        stem.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean);
        stem.position.set(Math.cos(a) * len * Math.sin(lean) * 0.5, potH + (len / 2) * Math.cos(lean), Math.sin(a) * len * Math.sin(lean) * 0.5);
        const leaf = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), X.leaf[i % X.leaf.length]);
        leaf.scale.set(0.45, 0.09, 1.25);
        leaf.position.set(Math.cos(a) * len * Math.sin(lean), potH + len * Math.cos(lean), Math.sin(a) * len * Math.sin(lean));
        leaf.rotation.set(0.4 * Math.sin(a), -a, 0.5);
        add(soft(leaf));
      }
      return true;
    }
    case 'pendant_lamp': {
      const C = n('ceiling'); const drop = n('drop'); const Dm = n('diameter');
      const y = C - drop;
      add(cyl(T, 0.05, 0.05, 0.02, X.black, 0, C - 0.02, 0));
      add(cyl(T, 0.003, 0.003, drop - 0.02, X.black, 0, y, 0, 6));
      const shade = add(cyl(T, 0.03, Dm / 2, Dm * 0.45, mat, 0, y - Dm * 0.45, 0, 32, true));
      shade.material = mat;
      add(cyl(T, 0.028, Dm / 2 - 0.004, Dm * 0.44, X.shadeIn, 0, y - Dm * 0.45, 0, 32, true));
      glow(T, add, X, 0, y - Dm * 0.3, 0, 6);
      return true;
    }
    case 'floor_lamp': {
      const H = n('height');
      add(cyl(T, 0.16, 0.17, 0.025, X.black, 0, 0, 0));
      add(cyl(T, 0.012, 0.012, H - 0.3, mat, 0, 0.025, 0, 10));
      add(cyl(T, 0.17, 0.21, 0.3, X.shadeIn, 0, H - 0.3, 0, 32, true));
      glow(T, add, X, 0, H - 0.18, 0, 5);
      return true;
    }
    case 'table_lamp': {
      const Y = n('elevation');
      add(cyl(T, 0.06, 0.08, 0.28, mat, 0, Y, 0));
      add(cyl(T, 0.13, 0.17, 0.22, X.shadeIn, 0, Y + 0.26, 0, 28, true));
      glow(T, add, X, 0, Y + 0.34, 0, 2.5);
      return true;
    }
    default: return false;
  }
}
