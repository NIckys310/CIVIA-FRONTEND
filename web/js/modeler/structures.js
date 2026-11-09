// Catálogo ampliado de estructuras de arquitectura e ingeniería, organizado como las clases de IFC
// (IfcFooting, IfcPile, IfcMember, IfcCurtainWall, IfcRoof, IfcRamp, IfcRailing, IfcCovering…).
// Cada tipo declara sus parámetros, su geometría (buildStructure) y su cómputo (structureQuantity).
// El cómputo debe coincidir con ModelQuantities.java del backend.

const P = (label, unit, def, min, max, step = 0.01) => ({ label, unit, def, min, max, step });
const CONCRETE = ['concreto'];
const FRAME = ['acero', 'madera', 'concreto'];
const WOOD_STEEL = ['madera', 'acero'];
const WALLING = ['ladrillo', 'bloque', 'concreto', 'pintura'];

const type = (label, icon, category, materials, params) => ({ label, icon, category, materials, material: materials[0], params });

export const CATEGORIES = ['Cimentación', 'Estructura', 'Cerramiento', 'Acabados', 'Cubiertas', 'Carpintería', 'Circulación'];

export const STRUCTURE_TYPES = {
  // ------------------------------------------------------------------ cimentación
  strip_footing: type('Zapata corrida', 'foundation', 'Cimentación', CONCRETE, { width: P('Ancho', 'm', 0.8, 0.3, 5, 0.05), length: P('Longitud', 'm', 6, 0.5, 60, 0.05), thickness: P('Espesor', 'm', 0.3, 0.15, 2, 0.05) }),
  grade_beam: type('Viga de cimentación', 'beam', 'Cimentación', CONCRETE, { b: P('Ancho', 'm', 0.3, 0.15, 2), h: P('Peralte', 'm', 0.5, 0.2, 3), length: P('Longitud', 'm', 5, 0.3, 60, 0.05) }),
  raft: type('Losa de cimentación', 'layers', 'Cimentación', CONCRETE, { width: P('Ancho (X)', 'm', 10, 1, 120, 0.05), length: P('Largo (Z)', 'm', 12, 1, 120, 0.05), thickness: P('Espesor', 'm', 0.4, 0.15, 3, 0.05) }),
  pile: type('Pilote', 'pile', 'Cimentación', ['concreto', 'acero'], { diameter: P('Diámetro', 'm', 0.5, 0.2, 3, 0.05), length: P('Profundidad', 'm', 12, 1, 80, 0.5) }),
  pile_cap: type('Dado o encepado', 'cube', 'Cimentación', CONCRETE, { width: P('Ancho', 'm', 1.5, 0.4, 12, 0.05), length: P('Largo', 'm', 1.5, 0.4, 12, 0.05), thickness: P('Altura', 'm', 0.8, 0.3, 4, 0.05) }),
  retaining_wall: type('Muro de contención', 'retaining', 'Cimentación', CONCRETE, { length: P('Longitud', 'm', 6, 0.5, 60, 0.05), height: P('Altura de pantalla', 'm', 3, 0.5, 15, 0.05), stem: P('Espesor de pantalla', 'm', 0.25, 0.15, 1.5), base: P('Ancho de base', 'm', 2, 0.5, 10, 0.05), baseT: P('Espesor de base', 'm', 0.3, 0.15, 1.5) }),

  // ------------------------------------------------------------------ estructura
  ribbed_slab: type('Losa nervada', 'ribbed', 'Estructura', CONCRETE, { width: P('Ancho (X)', 'm', 6, 1, 60, 0.05), length: P('Largo (Z)', 'm', 8, 1, 60, 0.05), topping: P('Loseta', 'm', 0.05, 0.04, 0.2), ribB: P('Ancho de nervio', 'm', 0.1, 0.06, 0.4), ribH: P('Altura de nervio', 'm', 0.25, 0.1, 1), spacing: P('Separación', 'm', 0.6, 0.3, 1.5, 0.05) }),
  truss: type('Cercha', 'truss', 'Estructura', WOOD_STEEL.slice().reverse(), { span: P('Luz', 'm', 10, 2, 60, 0.05), height: P('Altura', 'm', 2, 0.3, 12, 0.05), panels: P('Paneles', '', 8, 4, 24, 2), size: P('Sección de barra', 'm', 0.1, 0.03, 0.5) }),
  arch: type('Arco', 'arch', 'Estructura', ['concreto', 'acero', 'madera'], { span: P('Luz', 'm', 4, 0.6, 40, 0.05), rise: P('Flecha', 'm', 2, 0.1, 20, 0.05), b: P('Fondo', 'm', 0.3, 0.1, 3), h: P('Canto', 'm', 0.4, 0.1, 3) }),
  portal: type('Pórtico', 'portal', 'Estructura', FRAME, { span: P('Luz', 'm', 6, 1, 40, 0.05), height: P('Altura total', 'm', 4, 1, 20, 0.05), b: P('Ancho de sección', 'm', 0.4, 0.1, 2), h: P('Peralte de viga', 'm', 0.5, 0.1, 3) }),
  brace: type('Arriostramiento', 'brace', 'Estructura', FRAME, { kind: { label: 'Tipo', options: { x: 'En X', diag: 'Diagonal', v: 'En V' }, def: 'x' }, width: P('Ancho', 'm', 5, 0.5, 30, 0.05), height: P('Altura', 'm', 3, 0.5, 20, 0.05), size: P('Sección', 'm', 0.15, 0.03, 1) }),
  cantilever: type('Voladizo', 'cantilever', 'Estructura', CONCRETE, { width: P('Ancho', 'm', 3, 0.3, 40, 0.05), length: P('Vuelo', 'm', 2, 0.3, 12, 0.05), root: P('Canto en apoyo', 'm', 0.25, 0.1, 2), tip: P('Canto en punta', 'm', 0.12, 0.05, 1) }),
  corbel: type('Ménsula', 'corbel', 'Estructura', CONCRETE, { width: P('Ancho', 'm', 0.4, 0.15, 3), depth: P('Vuelo', 'm', 0.4, 0.1, 2), height: P('Altura', 'm', 0.5, 0.15, 3), tip: P('Altura en punta', 'm', 0.2, 0.05, 2) }),

  // ------------------------------------------------------------------ cerramiento
  partition: type('Tabique', 'partition', 'Cerramiento', ['pintura', 'bloque', 'ladrillo'], { length: P('Longitud', 'm', 3, 0.2, 40, 0.05), height: P('Altura', 'm', 2.4, 0.3, 8, 0.05), thickness: P('Espesor', 'm', 0.1, 0.05, 0.2) }),
  curtain_wall: type('Muro cortina', 'curtain', 'Cerramiento', ['vidrio'], { length: P('Longitud', 'm', 6, 0.5, 80, 0.05), height: P('Altura', 'm', 3.5, 0.5, 60, 0.05), modX: P('Módulo horizontal', 'm', 1.5, 0.4, 4, 0.05), modY: P('Módulo vertical', 'm', 1.2, 0.4, 4, 0.05), mullion: P('Ancho de montante', 'm', 0.06, 0.03, 0.2), depth: P('Fondo', 'm', 0.15, 0.05, 0.4) }),
  parapet: type('Antepecho o parapeto', 'parapet', 'Cerramiento', WALLING, { length: P('Longitud', 'm', 6, 0.2, 60, 0.05), height: P('Altura', 'm', 1, 0.3, 2.5, 0.05), thickness: P('Espesor', 'm', 0.15, 0.08, 0.5) }),
  lattice: type('Celosía', 'lattice', 'Cerramiento', ['madera', 'concreto', 'acero'], { length: P('Longitud', 'm', 3, 0.3, 30, 0.05), height: P('Altura', 'm', 2.4, 0.3, 10, 0.05), thickness: P('Fondo', 'm', 0.1, 0.02, 0.4), slat: P('Ancho de lama', 'm', 0.05, 0.02, 0.3), gap: P('Separación', 'm', 0.1, 0.02, 0.5) }),
  brise: type('Parasol (brise-soleil)', 'brise', 'Cerramiento', WOOD_STEEL, { length: P('Longitud', 'm', 4, 0.5, 40, 0.05), height: P('Altura', 'm', 3, 0.5, 20, 0.05), count: P('Lamas', '', 8, 2, 60, 1), depth: P('Fondo de lama', 'm', 0.25, 0.05, 1), tilt: P('Inclinación', '°', 30, 0, 80, 1) }),
  chimney: type('Chimenea', 'chimney', 'Cerramiento', ['ladrillo', 'concreto', 'bloque'], { width: P('Ancho', 'm', 0.6, 0.3, 3, 0.05), depth: P('Fondo', 'm', 0.6, 0.3, 3, 0.05), height: P('Altura', 'm', 4, 0.5, 30, 0.05), wall: P('Pared', 'm', 0.12, 0.05, 0.4) }),
  duct: type('Ducto técnico', 'pipe', 'Cerramiento', ['bloque', 'concreto', 'ladrillo'], { width: P('Ancho', 'm', 1.2, 0.3, 6, 0.05), depth: P('Fondo', 'm', 1.2, 0.3, 6, 0.05), height: P('Altura', 'm', 3, 0.5, 60, 0.05), wall: P('Pared', 'm', 0.1, 0.05, 0.4) }),

  // ------------------------------------------------------------------ acabados
  ceiling: type('Cielo raso', 'ceiling', 'Acabados', ['pintura', 'madera'], { width: P('Ancho (X)', 'm', 5, 0.3, 80, 0.05), length: P('Largo (Z)', 'm', 5, 0.3, 80, 0.05), height: P('Altura libre', 'm', 2.4, 1.8, 12, 0.05), thickness: P('Espesor', 'm', 0.012, 0.006, 0.1, 0.002) }),
  floor_finish: type('Piso o acabado', 'floor', 'Acabados', ['ceramica', 'madera', 'piedra', 'concreto'], { width: P('Ancho (X)', 'm', 5, 0.3, 80, 0.05), length: P('Largo (Z)', 'm', 5, 0.3, 80, 0.05), thickness: P('Espesor', 'm', 0.02, 0.005, 0.1, 0.005) }),
  cladding: type('Enchape de fachada', 'cladding', 'Acabados', ['piedra', 'ceramica', 'madera', 'aluminio'], { length: P('Longitud', 'm', 4, 0.2, 60, 0.05), height: P('Altura', 'm', 2.6, 0.2, 40, 0.05), thickness: P('Espesor', 'm', 0.03, 0.005, 0.15, 0.005) }),

  // ------------------------------------------------------------------ cubiertas
  shed_roof: type('Cubierta a un agua', 'shedroof', 'Cubiertas', ['teja', 'acero', 'concreto', 'madera'], { width: P('Ancho (X)', 'm', 6, 1, 40, 0.05), length: P('Largo (Z)', 'm', 8, 1, 80, 0.05), pitch: P('Pendiente', '°', 10, 1, 60, 1), thickness: P('Espesor', 'm', 0.1, 0.03, 0.5) }),
  hip_roof: type('Cubierta a cuatro aguas', 'hiproof', 'Cubiertas', ['teja', 'acero', 'concreto', 'madera'], { width: P('Ancho (X)', 'm', 8, 1, 60, 0.05), length: P('Largo (Z)', 'm', 12, 1, 80, 0.05), pitch: P('Pendiente', '°', 25, 5, 60, 1) }),
  flat_roof: type('Cubierta plana', 'flatroof', 'Cubiertas', CONCRETE, { width: P('Ancho (X)', 'm', 8, 1, 80, 0.05), length: P('Largo (Z)', 'm', 10, 1, 80, 0.05), thickness: P('Espesor', 'm', 0.2, 0.08, 1), parapet: P('Altura de pretil', 'm', 0.6, 0.1, 2, 0.05) }),
  mansard: type('Mansarda', 'mansard', 'Cubiertas', ['teja', 'acero', 'madera'], { width: P('Ancho (X)', 'm', 10, 3, 60, 0.05), length: P('Largo (Z)', 'm', 12, 3, 80, 0.05), lowerH: P('Altura del faldón', 'm', 2, 0.8, 6, 0.05), inset: P('Retranqueo', 'm', 1.5, 0.3, 6, 0.05), upperPitch: P('Pendiente superior', '°', 15, 2, 45, 1) }),
  sawtooth: type('Cubierta en diente de sierra', 'sawtooth', 'Cubiertas', ['concreto', 'acero', 'madera'], { width: P('Ancho (X)', 'm', 12, 3, 80, 0.05), length: P('Largo (Z)', 'm', 10, 1, 80, 0.05), teeth: P('Dientes', '', 3, 1, 20, 1), height: P('Altura', 'm', 1.5, 0.4, 6, 0.05) }),
  dome: type('Cúpula', 'dome', 'Cubiertas', ['concreto', 'acero', 'vidrio', 'teja'], { diameter: P('Diámetro', 'm', 8, 1, 60, 0.05), rise: P('Flecha', 'm', 4, 0.3, 30, 0.05), thickness: P('Espesor', 'm', 0.12, 0.03, 1) }),
  vault: type('Bóveda de cañón', 'vault', 'Cubiertas', ['concreto', 'ladrillo', 'acero'], { span: P('Luz', 'm', 6, 1, 40, 0.05), rise: P('Flecha', 'm', 3, 0.3, 20, 0.05), length: P('Longitud', 'm', 10, 1, 80, 0.05), thickness: P('Espesor', 'm', 0.15, 0.05, 1) }),
  pergola: type('Pérgola', 'pergola', 'Cubiertas', WOOD_STEEL, { width: P('Ancho (X)', 'm', 3, 1, 12, 0.05), length: P('Largo (Z)', 'm', 4, 1, 20, 0.05), height: P('Altura', 'm', 2.6, 2, 6, 0.05), post: P('Sección de poste', 'm', 0.15, 0.06, 0.5), spacing: P('Separación de correas', 'm', 0.5, 0.2, 1.5, 0.05) }),
  canopy: type('Marquesina', 'canopy', 'Cubiertas', ['vidrio', 'acero', 'concreto'], { width: P('Ancho', 'm', 3, 0.6, 30, 0.05), depth: P('Vuelo', 'm', 1.5, 0.4, 6, 0.05), height: P('Altura', 'm', 2.6, 2, 8, 0.05), thickness: P('Espesor', 'm', 0.1, 0.02, 0.5) }),
  dormer: type('Buhardilla', 'dormer', 'Cubiertas', ['teja', 'acero', 'madera'], { width: P('Ancho', 'm', 1.6, 0.8, 5, 0.05), depth: P('Fondo', 'm', 2, 0.8, 6, 0.05), height: P('Altura de frente', 'm', 1.4, 0.8, 3, 0.05), pitch: P('Pendiente', '°', 30, 10, 55, 1) }),

  // ------------------------------------------------------------------ carpintería
  double_door: type('Puerta doble', 'doubledoor', 'Carpintería', ['madera', 'acero', 'vidrio'], { width: P('Ancho', 'm', 1.6, 1.2, 3.6), height: P('Altura', 'm', 2.1, 1.8, 3.5), depth: P('Espesor del muro', 'm', 0.15, 0.05, 0.6) }),
  sliding_door: type('Puerta corrediza', 'slidingdoor', 'Carpintería', ['vidrio', 'madera', 'aluminio'], { width: P('Ancho', 'm', 2.4, 1.2, 8), height: P('Altura', 'm', 2.2, 1.8, 3.5), depth: P('Espesor del muro', 'm', 0.15, 0.05, 0.6) }),
  garage_door: type('Puerta de garaje', 'garage', 'Carpintería', ['acero', 'madera', 'aluminio'], { width: P('Ancho', 'm', 3, 2, 8), height: P('Altura', 'm', 2.2, 1.9, 5), depth: P('Espesor del muro', 'm', 0.15, 0.05, 0.6) }),
  sliding_window: type('Ventana corrediza', 'slidingwindow', 'Carpintería', ['vidrio'], { width: P('Ancho', 'm', 1.8, 0.6, 6), height: P('Altura', 'm', 1.2, 0.4, 3), sill: P('Antepecho', 'm', 0.9, 0, 3), depth: P('Espesor del muro', 'm', 0.15, 0.05, 0.6) }),
  skylight: type('Tragaluz', 'skylight', 'Carpintería', ['vidrio'], { width: P('Ancho', 'm', 1.2, 0.4, 8, 0.05), length: P('Largo', 'm', 1.2, 0.4, 8, 0.05), curb: P('Altura de marco', 'm', 0.2, 0.05, 0.6) }),

  // ------------------------------------------------------------------ circulación
  l_stair: type('Escalera en L', 'lstair', 'Circulación', ['concreto', 'madera', 'acero'], { width: P('Ancho', 'm', 1.1, 0.6, 3, 0.05), stepsA: P('Peldaños tramo 1', '', 8, 2, 20, 1), stepsB: P('Peldaños tramo 2', '', 8, 2, 20, 1), riser: P('Contrahuella', 'm', 0.175, 0.12, 0.22, 0.005), tread: P('Huella', 'm', 0.28, 0.22, 0.4, 0.005) }),
  u_stair: type('Escalera en U', 'ustair', 'Circulación', ['concreto', 'madera', 'acero'], { width: P('Ancho', 'm', 1.1, 0.6, 3, 0.05), stepsA: P('Peldaños tramo 1', '', 8, 2, 20, 1), stepsB: P('Peldaños tramo 2', '', 8, 2, 20, 1), riser: P('Contrahuella', 'm', 0.175, 0.12, 0.22, 0.005), tread: P('Huella', 'm', 0.28, 0.22, 0.4, 0.005) }),
  spiral_stair: type('Escalera de caracol', 'spiral', 'Circulación', ['acero', 'madera', 'concreto'], { diameter: P('Diámetro', 'm', 2, 1.2, 4, 0.05), steps: P('Peldaños', '', 16, 4, 40, 1), riser: P('Contrahuella', 'm', 0.19, 0.14, 0.24, 0.005), turn: P('Giro total', '°', 360, 90, 720, 15) }),
  ramp: type('Rampa', 'ramp', 'Circulación', CONCRETE, { width: P('Ancho', 'm', 1.5, 0.9, 8, 0.05), length: P('Longitud', 'm', 6, 1, 40, 0.05), rise: P('Desnivel', 'm', 0.5, 0.05, 6, 0.05), thickness: P('Espesor', 'm', 0.15, 0.08, 0.5) }),
  landing: type('Descanso', 'layers', 'Circulación', ['concreto', 'madera', 'acero'], { width: P('Ancho (X)', 'm', 1.2, 0.6, 6, 0.05), length: P('Largo (Z)', 'm', 1.2, 0.6, 6, 0.05), thickness: P('Espesor', 'm', 0.15, 0.05, 0.5) }),
  railing: type('Baranda', 'railing', 'Circulación', ['acero', 'madera', 'vidrio'], { length: P('Longitud', 'm', 4, 0.3, 60, 0.05), height: P('Altura', 'm', 1, 0.8, 1.6, 0.05), spacing: P('Separación de postes', 'm', 1.2, 0.3, 3, 0.05) }),
  balcony: type('Balcón', 'balcony', 'Circulación', CONCRETE, { width: P('Ancho', 'm', 3, 0.8, 20, 0.05), depth: P('Vuelo', 'm', 1.2, 0.4, 4, 0.05), thickness: P('Espesor', 'm', 0.12, 0.08, 0.5), rail: P('Altura de baranda', 'm', 1, 0.8, 1.6, 0.05) }),
  elevator: type('Ascensor', 'elevator', 'Circulación', CONCRETE, { width: P('Ancho', 'm', 2, 1.2, 5, 0.05), depth: P('Fondo', 'm', 2, 1.2, 5, 0.05), height: P('Altura', 'm', 6, 2.5, 200, 0.05), wall: P('Pared', 'm', 0.2, 0.1, 0.5) }),
};

/** Elementos en los que se abren vanos y los que los abren (compartido con el panel y con wallOpenings). */
export const WALL_TYPES = new Set(['wall', 'partition']);
export const OPENING_TYPES = new Set(['door', 'window', 'double_door', 'sliding_door', 'garage_door', 'sliding_window']);
export const WINDOW_TYPES = new Set(['window', 'sliding_window']);

/** Datos de un arco circular de luz S y flecha R; la flecha no pasa de la semicircunferencia. */
function arcOf(S, R) {
  const rise = Math.min(R, S / 2);
  const rho = (S * S / 4 + rise * rise) / (2 * rise);
  const cy = rise - rho;
  const a0 = Math.atan2(-cy, S / 2);
  return { rho, cy, a0, a1: Math.PI - a0 };
}

function trussNodes(S, H, panelsRaw) {
  const n = Math.round(panelsRaw / 2) * 2;
  const dx = S / n;
  const h = (i) => H * (1 - Math.abs((2 * i) / n - 1));
  return { n, dx, h };
}

const flightVolume = (steps, r, t, w) => (Math.hypot(steps * r, (steps - 1) * t) * 0.15 + (steps * r * t) / 2) * w;

function shell(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }

/** Barra entre dos puntos. */
function bar(T, a, b, size, material) {
  const A = new T.Vector3(...a); const B = new T.Vector3(...b);
  const m = new T.Mesh(new T.BoxGeometry(A.distanceTo(B), size, size), material);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), B.clone().sub(A).normalize());
  return shell(m);
}

/** Prisma: polígono en XY extruido a lo largo de Z, centrado. */
function prism(T, points, depth, material) {
  const s = new T.Shape(points.map(([x, y]) => new T.Vector2(x, y)));
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return shell(new T.Mesh(g, material));
}

/** Superficie de caras planas visible por ambos lados. */
function surface(T, vertices, faces, material) {
  const pos = []; const uv = [];
  const push = (i) => { const [x, y, z] = vertices[i]; pos.push(x, y, z); uv.push(x, z); };
  for (const [a, b, c] of faces) { [a, b, c, c, b, a].forEach(push); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return shell(new T.Mesh(g, material));
}

/** Banda curva (arco o bóveda) de fondo `depth` a lo largo de Z. */
function arcBand(T, S, R, thickness, depth, material) {
  const { rho, cy, a0, a1 } = arcOf(S, R);
  const s = new T.Shape();
  s.absarc(0, cy, rho + thickness, a0, a1, false);
  s.absarc(0, cy, rho, a1, a0, true);
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 48 });
  g.translate(0, 0, -depth / 2);
  return shell(new T.Mesh(g, material));
}

/** Marco de puerta o ventana: jambas y dintel; con `sill`, también travesaño inferior. */
function frame(box, mats, w, h, d, f, y = 0, closed = false) {
  box(f, h, d, mats.frame, -w / 2 + f / 2, y);
  box(f, h, d, mats.frame, w / 2 - f / 2, y);
  box(w, f, d, mats.frame, 0, y + h - f);
  if (closed) box(w, f, d, mats.frame, 0, y);
}

function knob(T, mats, add, x, z = 0.05) {
  const k = add(new T.Mesh(new T.SphereGeometry(0.035, 16, 12), mats.handle));
  k.position.set(x, 1.05, z);
}

function steps(box, count, r, t, w, material, place) {
  for (let i = 0; i < count; i++) place(i, box, r * (i + 1), t, w, material);
}

/** Construye la geometría de un tipo del catálogo ampliado. Devuelve false si el tipo no es de este módulo. */
export function buildStructure(T, el, mats, mat, add, boxAt, n) {
  const box = (...a) => add(boxAt(T, ...a));
  const p = n;
  switch (el.type) {
    case 'strip_footing': box(p('length'), p('thickness'), p('width'), mat); return true;
    case 'grade_beam': box(p('length'), p('h'), p('b'), mat); return true;
    case 'raft': case 'pile_cap': case 'landing': box(p('width'), p('thickness'), p('length'), mat); return true;
    case 'pile': {
      const r = p('diameter') / 2; const L = p('length');
      const m = add(shell(new T.Mesh(new T.CylinderGeometry(r, r, L, 28), mat)));
      m.position.y = -L / 2;
      return true;
    }
    case 'retaining_wall': {
      const L = p('length'); const H = p('height'); const stem = p('stem'); const B = p('base'); const tb = p('baseT');
      const toe = (B - stem) / 3;
      const m = add(prism(T, [[-B / 2, 0], [B / 2, 0], [B / 2, tb], [-B / 2 + toe + stem, tb], [-B / 2 + toe + stem, tb + H], [-B / 2 + toe, tb + H], [-B / 2 + toe, tb], [-B / 2, tb]], L, mat));
      m.rotation.y = Math.PI / 2;
      return true;
    }
    case 'ribbed_slab': {
      const W = p('width'); const L = p('length'); const ribH = p('ribH'); const ribB = p('ribB'); const sp = p('spacing');
      const count = Math.max(1, Math.floor(W / sp));
      box(W, p('topping'), L, mat, 0, ribH);
      for (let i = 0; i < count; i++) box(ribB, ribH, L, mat, ((i - (count - 1) / 2) * sp));
      return true;
    }
    case 'truss': {
      const S = p('span'); const size = p('size');
      const { n: count, dx, h } = trussNodes(S, p('height'), p('panels'));
      const x = (i) => -S / 2 + i * dx;
      add(bar(T, [x(0), 0, 0], [x(count), 0, 0], size, mat));
      for (let i = 0; i < count; i++) add(bar(T, [x(i), h(i), 0], [x(i + 1), h(i + 1), 0], size, mat));
      for (let i = 1; i < count; i++) add(bar(T, [x(i), 0, 0], [x(i), h(i), 0], size * 0.8, mat));
      for (let i = 1; i < count / 2; i++) add(bar(T, [x(i), 0, 0], [x(i + 1), h(i + 1), 0], size * 0.8, mat));
      for (let i = count / 2 + 1; i < count; i++) add(bar(T, [x(i), 0, 0], [x(i - 1), h(i - 1), 0], size * 0.8, mat));
      return true;
    }
    case 'arch': add(arcBand(T, p('span'), p('rise'), p('h'), p('b'), mat)); return true;
    case 'portal': {
      const S = p('span'); const H = p('height'); const b = p('b'); const h = p('h');
      box(b, H - h, b, mat, -S / 2); box(b, H - h, b, mat, S / 2);
      box(S + b, h, b, mat, 0, H - h);
      return true;
    }
    case 'brace': {
      const W = p('width'); const H = p('height'); const s = p('size');
      const kind = el.params.kind;
      if (kind === 'diag') add(bar(T, [-W / 2, 0, 0], [W / 2, H, 0], s, mat));
      else if (kind === 'v') { add(bar(T, [-W / 2, H, 0], [0, 0, 0], s, mat)); add(bar(T, [W / 2, H, 0], [0, 0, 0], s, mat)); }
      else { add(bar(T, [-W / 2, 0, 0], [W / 2, H, 0], s, mat)); add(bar(T, [-W / 2, H, 0], [W / 2, 0, 0], s, mat)); }
      return true;
    }
    case 'cantilever': {
      const L = p('length'); const root = p('root');
      const m = add(prism(T, [[0, 0], [L, root - p('tip')], [L, root], [0, root]], p('width'), mat));
      m.rotation.y = -Math.PI / 2;
      return true;
    }
    case 'corbel': {
      const D = p('depth'); const H = p('height');
      const m = add(prism(T, [[0, 0], [D, H - Math.min(p('tip'), H)], [D, H], [0, H]], p('width'), mat));
      m.rotation.y = -Math.PI / 2;
      return true;
    }
    case 'curtain_wall': {
      const L = p('length'); const H = p('height'); const mx = p('modX'); const my = p('modY'); const m = p('mullion'); const d = p('depth');
      const glass = box(L, H, 0.016, mats.get('vidrio')); glass.castShadow = false;
      const cols = Math.max(1, Math.round(L / mx)); const rows = Math.max(1, Math.round(H / my));
      for (let i = 0; i <= cols; i++) box(m, H, d, mats.frame, -L / 2 + (i * L) / cols);
      for (let j = 0; j <= rows; j++) box(L + m, m, d, mats.frame, 0, Math.min((j * H) / rows, H - m));
      return true;
    }
    case 'parapet': {
      const L = p('length'); const H = p('height'); const t = p('thickness');
      box(L, H - 0.05, t, mat);
      box(L + 0.04, 0.05, t + 0.08, mats.get('concreto'), 0, H - 0.05);
      return true;
    }
    case 'lattice': {
      const L = p('length'); const H = p('height'); const t = p('thickness'); const s = p('slat'); const g = p('gap');
      const count = Math.max(1, Math.floor(L / (s + g)));
      for (let i = 0; i < count; i++) box(s, H, t, mat, (i - (count - 1) / 2) * (s + g));
      return true;
    }
    case 'brise': {
      const L = p('length'); const H = p('height'); const count = Math.round(p('count')); const D = p('depth'); const tilt = (p('tilt') * Math.PI) / 180;
      for (let i = 0; i < count; i++) {
        const lama = box(L, 0.03, D, mat, 0, ((i + 0.5) * H) / count);
        lama.rotation.x = tilt;
      }
      for (const x of [-L / 2, L / 2]) box(0.06, H, 0.06, mats.frame, x);
      return true;
    }
    case 'chimney': case 'duct': {
      const W = p('width'); const D = p('depth'); const H = p('height'); const t = Math.min(p('wall'), Math.min(W, D) / 2.5);
      box(W, H, t, mat, 0, 0, -D / 2 + t / 2); box(W, H, t, mat, 0, 0, D / 2 - t / 2);
      box(t, H, D - 2 * t, mat, -W / 2 + t / 2); box(t, H, D - 2 * t, mat, W / 2 - t / 2);
      if (el.type === 'chimney') box(W + 0.12, 0.08, D + 0.12, mats.get('concreto'), 0, H);
      return true;
    }
    case 'ceiling': box(p('width'), p('thickness'), p('length'), mat, 0, p('height')); return true;
    case 'floor_finish': box(p('width'), p('thickness'), p('length'), mat); return true;
    case 'cladding': box(p('length'), p('height'), p('thickness'), mat); return true;
    case 'shed_roof': {
      const W = p('width'); const pitch = (p('pitch') * Math.PI) / 180; const slope = W / Math.cos(pitch);
      const plane = box(slope, p('thickness'), p('length') + 0.3, mat);
      plane.position.set(0, (W * Math.tan(pitch)) / 2, 0);
      plane.rotation.z = pitch;
      return true;
    }
    case 'hip_roof': {
      const W = p('width'); const L = p('length'); const short = Math.min(W, L); const h = (short / 2) * Math.tan((p('pitch') * Math.PI) / 180);
      const x = W / 2; const z = L / 2; const rx = Math.max(0, x - short / 2); const rz = Math.max(0, z - short / 2);
      const v = [[-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z], [-rx, h, -rz], [rx, h, -rz], [rx, h, rz], [-rx, h, rz]];
      add(surface(T, v, [[0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2], [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]], mat));
      return true;
    }
    case 'flat_roof': {
      const W = p('width'); const L = p('length'); const t = p('thickness'); const H = p('parapet'); const c = 0.15;
      box(W, t, L, mat);
      box(W, H, c, mat, 0, t, -L / 2 + c / 2); box(W, H, c, mat, 0, t, L / 2 - c / 2);
      box(c, H, L - 2 * c, mat, -W / 2 + c / 2, t); box(c, H, L - 2 * c, mat, W / 2 - c / 2, t);
      return true;
    }
    case 'mansard': {
      const W = p('width'); const L = p('length'); const H = p('lowerH'); const i = Math.min(p('inset'), Math.min(W, L) * 0.45);
      const x = W / 2; const z = L / 2; const ix = x - i; const iz = z - i;
      const short = Math.min(ix, iz); const top = H + short * Math.tan((p('upperPitch') * Math.PI) / 180);
      const rx = Math.max(0, ix - short); const rz = Math.max(0, iz - short);
      const v = [[-x, 0, -z], [x, 0, -z], [x, 0, z], [-x, 0, z], [-ix, H, -iz], [ix, H, -iz], [ix, H, iz], [-ix, H, iz], [-rx, top, -rz], [rx, top, -rz], [rx, top, rz], [-rx, top, rz]];
      const ring = (a, b, c, d) => [[a, c, d], [a, d, b]];
      add(surface(T, v, [...ring(0, 1, 4, 5), ...ring(1, 2, 5, 6), ...ring(2, 3, 6, 7), ...ring(3, 0, 7, 4), ...ring(4, 5, 8, 9), ...ring(5, 6, 9, 10), ...ring(6, 7, 10, 11), ...ring(7, 4, 11, 8)], mat));
      return true;
    }
    case 'sawtooth': {
      const W = p('width'); const L = p('length'); const count = Math.round(p('teeth')); const H = p('height'); const tw = W / count;
      for (let i = 0; i < count; i++) {
        const x0 = -W / 2 + i * tw;
        add(surface(T, [[x0, 0, -L / 2], [x0 + tw, H, -L / 2], [x0 + tw, H, L / 2], [x0, 0, L / 2]], [[0, 1, 2], [0, 2, 3]], mat));
        const glass = box(0.02, H, L, mats.get('vidrio'), x0 + tw);
        glass.castShadow = false;
      }
      return true;
    }
    case 'dome': {
      const a = p('diameter') / 2; const rise = Math.min(p('rise'), a); const t = p('thickness');
      const rho = (a * a + rise * rise) / (2 * rise); const cy = rise - rho; const phi = Math.asin(a / rho);
      const pts = [];
      for (let i = 0; i <= 40; i++) { const f = phi * (1 - i / 40); pts.push(new T.Vector2((rho + t) * Math.sin(f), cy + (rho + t) * Math.cos(f))); }
      for (let i = 0; i <= 40; i++) { const f = (phi * i) / 40; pts.push(new T.Vector2(Math.max(0, rho * Math.sin(f)), cy + rho * Math.cos(f))); }
      add(shell(new T.Mesh(new T.LatheGeometry(pts, 64), mat)));
      return true;
    }
    case 'vault': add(arcBand(T, p('span'), p('rise'), p('thickness'), p('length'), mat)); return true;
    case 'pergola': {
      const W = p('width'); const L = p('length'); const H = p('height'); const s = p('post'); const sp = p('spacing');
      for (const x of [-W / 2, W / 2]) for (const z of [-L / 2, L / 2]) box(s, H, s, mat, x, 0, z);
      for (const x of [-W / 2, W / 2]) box(s, s, L + s, mat, x, H);
      const rafters = Math.max(2, Math.floor(L / sp) + 1);
      for (let i = 0; i < rafters; i++) box(W + 0.4, 0.15, 0.05, mat, 0, H + s, -L / 2 + (i * L) / (rafters - 1));
      return true;
    }
    case 'canopy': {
      const W = p('width'); const D = p('depth'); const H = p('height'); const t = p('thickness');
      const slab = box(W, t, D, mat, 0, H, D / 2);
      if (el.material === 'vidrio') slab.castShadow = false;
      for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) add(bar(T, [x, H + t, D * 0.9], [x, H + 1, 0], 0.03, mats.frame));
      return true;
    }
    case 'dormer': {
      const W = p('width'); const D = p('depth'); const H = p('height'); const pitch = (p('pitch') * Math.PI) / 180;
      const wall = mats.get('pintura'); const rise = (W / 2) * Math.tan(pitch); const slope = W / 2 / Math.cos(pitch);
      box(0.1, H, D, wall, -W / 2 + 0.05); box(0.1, H, D, wall, W / 2 - 0.05);
      const gable = add(prism(T, [[-W / 2, 0], [W / 2, 0], [0, rise]], 0.1, wall));
      gable.position.set(0, H, D / 2 - 0.05);
      frame(box, mats, W - 0.2, H - 0.1, 0.1, 0.05, 0.05, true);
      const glass = box(W - 0.3, H - 0.2, 0.012, mats.get('vidrio'), 0, 0.1, D / 2 - 0.02);
      glass.castShadow = false;
      for (const side of [-1, 1]) {
        const plane = box(slope, 0.08, D + 0.25, mat);
        plane.position.set((side * W) / 4, H + rise / 2 + 0.05, 0);
        plane.rotation.z = -side * pitch;
      }
      return true;
    }
    case 'double_door': {
      const w = p('width'); const h = p('height'); const d = p('depth'); const f = 0.06; const leaf = (w - 2 * f) / 2;
      frame(box, mats, w, h, d, f);
      box(leaf - 0.005, h - f, 0.045, mat, -leaf / 2); box(leaf - 0.005, h - f, 0.045, mat, leaf / 2);
      knob(T, mats, add, -0.08); knob(T, mats, add, 0.08);
      return true;
    }
    case 'sliding_door': {
      const w = p('width'); const h = p('height'); const d = p('depth'); const f = 0.06; const pane = (w - 2 * f) / 2 + 0.03;
      frame(box, mats, w, h, d, f); box(w, f / 2, d, mats.frame);
      for (const [x, z] of [[-pane / 2 + 0.03, -0.03], [pane / 2 - 0.03, 0.03]]) {
        const leaf = box(pane, h - 1.5 * f, 0.03, mat, x, f / 2, z);
        leaf.castShadow = el.material !== 'vidrio';
        for (const s of [-1, 1]) box(0.04, h - 1.5 * f, 0.05, mats.frame, x + (s * pane) / 2, f / 2, z);
      }
      return true;
    }
    case 'garage_door': {
      const w = p('width'); const h = p('height'); const d = p('depth'); const f = 0.08; const panels = Math.max(3, Math.round(h / 0.5));
      frame(box, mats, w, h, d, f);
      const ph = (h - f) / panels;
      for (let i = 0; i < panels; i++) box(w - 2 * f, ph - 0.012, 0.05, mat, 0, i * ph + 0.006);
      return true;
    }
    case 'sliding_window': {
      const w = p('width'); const h = p('height'); const s = p('sill'); const d = p('depth'); const f = 0.05; const pane = (w - 2 * f) / 2 + 0.02;
      frame(box, mats, w, h, d, f, s, true);
      box(w + 0.06, 0.03, d + 0.05, mats.get('concreto'), 0, s - 0.03);
      for (const [x, z] of [[-pane / 2 + 0.02, -0.02], [pane / 2 - 0.02, 0.02]]) {
        const leaf = box(pane, h - 2 * f, 0.012, mats.get('vidrio'), x, s + f, z);
        leaf.castShadow = false;
        for (const side of [-1, 1]) box(0.035, h - 2 * f, 0.03, mats.frame, x + (side * pane) / 2, s + f, z);
      }
      return true;
    }
    case 'skylight': {
      const W = p('width'); const L = p('length'); const c = p('curb'); const f = 0.06;
      box(W, c, f, mats.frame, 0, 0, -L / 2 + f / 2); box(W, c, f, mats.frame, 0, 0, L / 2 - f / 2);
      box(f, c, L - 2 * f, mats.frame, -W / 2 + f / 2); box(f, c, L - 2 * f, mats.frame, W / 2 - f / 2);
      const glass = box(W, 0.02, L, mats.get('vidrio'), 0, c);
      glass.castShadow = false;
      return true;
    }
    case 'l_stair': {
      const w = p('width'); const A = Math.round(p('stepsA')); const B = Math.round(p('stepsB')); const r = p('riser'); const t = p('tread');
      steps(box, A, r, t, w, mat, (i, b, h, tr, wd, m) => b(tr, h, wd, m, i * tr + tr / 2));
      const landY = A * r; const lx = A * t + w / 2;
      box(w, landY, w, mat, lx);
      steps(box, B, r, t, w, mat, (i, b, h, tr, wd, m) => b(wd, landY + h, tr, m, lx, 0, w / 2 + i * tr + tr / 2));
      return true;
    }
    case 'u_stair': {
      const w = p('width'); const A = Math.round(p('stepsA')); const B = Math.round(p('stepsB')); const r = p('riser'); const t = p('tread'); const gap = 0.1;
      steps(box, A, r, t, w, mat, (i, b, h, tr, wd, m) => b(tr, h, wd, m, i * tr + tr / 2));
      const landY = A * r; const end = A * t; const zc = (w + gap) / 2;
      box(w, landY, 2 * w + gap, mat, end + w / 2, 0, zc);
      steps(box, B, r, t, w, mat, (i, b, h, tr, wd, m) => b(tr, landY + h, wd, m, end - i * tr - tr / 2, 0, w + gap));
      return true;
    }
    case 'spiral_stair': {
      const R = p('diameter') / 2; const count = Math.round(p('steps')); const r = p('riser'); const turn = (p('turn') * Math.PI) / 180;
      const per = turn / count;
      const pole = add(shell(new T.Mesh(new T.CylinderGeometry(0.08, 0.08, count * r + 1, 24), mats.frame)));
      pole.position.y = (count * r + 1) / 2;
      for (let i = 0; i < count; i++) {
        const s = new T.Shape();
        s.moveTo(0, 0);
        s.absarc(0, 0, R, 0, per * 1.08, false);
        s.lineTo(0, 0);
        const g = new T.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false, curveSegments: 12 });
        g.rotateX(-Math.PI / 2);
        const m = add(shell(new T.Mesh(g, mat)));
        m.position.y = (i + 1) * r - 0.04;
        m.rotation.y = i * per;
      }
      return true;
    }
    case 'ramp': {
      const L = p('length'); const rise = p('rise'); const t = p('thickness');
      add(prism(T, [[-L / 2, 0], [-L / 2, -t], [L / 2, rise - t], [L / 2, rise]], p('width'), mat));
      return true;
    }
    case 'railing': {
      const L = p('length'); const H = p('height'); const sp = p('spacing'); const a = 0.05;
      if (el.material === 'vidrio') {
        const glass = box(L, H, 0.012, mat); glass.castShadow = false;
        box(L, 0.04, 0.05, mats.frame, 0, H);
        return true;
      }
      box(L, a, a, mat, 0, H - a); box(L, a, a, mat, 0, H * 0.5);
      const posts = Math.ceil(L / sp) + 1;
      for (let i = 0; i < posts; i++) box(a, H, a, mat, -L / 2 + (i * L) / (posts - 1));
      return true;
    }
    case 'balcony': {
      const W = p('width'); const D = p('depth'); const t = p('thickness'); const H = p('rail'); const glass = mats.get('vidrio');
      box(W, t, D, mat, 0, 0, D / 2);
      for (const [w, d, x, z] of [[W, 0.012, 0, D - 0.03], [0.012, D, -W / 2 + 0.03, D / 2], [0.012, D, W / 2 - 0.03, D / 2]]) {
        const pane = box(w, H, d, glass, x, t, z);
        pane.castShadow = false;
      }
      box(W, 0.04, 0.05, mats.frame, 0, t + H, D - 0.03);
      for (const x of [-W / 2 + 0.03, W / 2 - 0.03]) box(0.05, 0.04, D, mats.frame, x, t + H, D / 2);
      return true;
    }
    case 'elevator': {
      const W = p('width'); const D = p('depth'); const H = p('height'); const t = p('wall'); const open = Math.min(1, W - 2 * t - 0.2);
      box(W, H, t, mat, 0, 0, -D / 2 + t / 2);
      box(t, H, D - 2 * t, mat, -W / 2 + t / 2); box(t, H, D - 2 * t, mat, W / 2 - t / 2);
      const side = (W - open) / 2;
      box(side, H, t, mat, -W / 2 + side / 2, 0, D / 2 - t / 2); box(side, H, t, mat, W / 2 - side / 2, 0, D / 2 - t / 2);
      box(open, Math.max(0.1, H - 2.1), t, mat, 0, 2.1, D / 2 - t / 2);
      box(open, 2.1, 0.03, mats.handle, 0, 0, D / 2 - t / 2);
      box(W - 2 * t - 0.1, 2.3, D - 2 * t - 0.1, mats.frame, 0, 0.05, 0);
      return true;
    }
    default: return false;
  }
}

/** Cantidad de un tipo del catálogo: en qué renglón se suma y cuánto. Debe coincidir con ModelQuantities.java. */
export function structureQuantity(el, p) {
  switch (el.type) {
    case 'strip_footing': case 'raft': case 'pile_cap': case 'landing': return { bucket: 'volume', q: p('width') * p('length') * p('thickness') };
    case 'grade_beam': return { bucket: 'volume', q: p('b') * p('h') * p('length') };
    case 'pile': return { bucket: 'volume', q: Math.PI * (p('diameter') / 2) ** 2 * p('length') };
    case 'retaining_wall': return { bucket: 'volume', q: p('length') * (p('height') * p('stem') + p('base') * p('baseT')) };
    case 'ribbed_slab': return { bucket: 'volume', q: p('width') * p('length') * p('topping') + Math.max(1, Math.floor(p('width') / p('spacing'))) * p('ribB') * p('ribH') * p('length') };
    case 'truss': {
      const { n, dx, h } = trussNodes(p('span'), p('height'), p('panels'));
      let total = p('span');
      for (let i = 0; i < n; i++) total += Math.hypot(dx, h(i + 1) - h(i));
      for (let i = 1; i < n; i++) total += h(i);
      for (let i = 1; i < n / 2; i++) total += Math.hypot(dx, h(i + 1));
      for (let i = n / 2 + 1; i < n; i++) total += Math.hypot(dx, h(i - 1));
      return { bucket: 'volume', q: total * p('size') ** 2 };
    }
    case 'arch': {
      const { rho, a0, a1 } = arcOf(p('span'), p('rise'));
      return { bucket: 'volume', q: (rho + p('h') / 2) * (a1 - a0) * p('b') * p('h') };
    }
    case 'portal': return { bucket: 'volume', q: 2 * p('b') * p('b') * (p('height') - p('h')) + p('b') * p('h') * (p('span') + p('b')) };
    case 'brace': {
      const W = p('width'); const H = p('height'); const k = el.params.kind;
      const L = k === 'diag' ? Math.hypot(W, H) : k === 'v' ? 2 * Math.hypot(W / 2, H) : 2 * Math.hypot(W, H);
      return { bucket: 'volume', q: L * p('size') ** 2 };
    }
    case 'cantilever': return { bucket: 'volume', q: (p('width') * p('length') * (p('root') + p('tip'))) / 2 };
    case 'corbel': return { bucket: 'volume', q: (p('width') * p('depth') * (p('height') + p('tip'))) / 2 };
    case 'partition': case 'parapet': return { bucket: 'wall', q: p('length') * p('height'), t: p('thickness') };
    case 'chimney': case 'duct': return { bucket: 'wall', q: 2 * (p('width') + p('depth')) * p('height'), t: p('wall') };
    case 'curtain_wall': return { bucket: 'glass', q: p('length') * p('height') };
    case 'lattice': return { bucket: 'volume', q: Math.max(1, Math.floor(p('length') / (p('slat') + p('gap')))) * p('slat') * p('thickness') * p('height') };
    case 'brise': return { bucket: 'volume', q: Math.round(p('count')) * p('length') * p('depth') * 0.03 };
    case 'ceiling': case 'floor_finish': return { bucket: 'finish', q: p('width') * p('length') };
    case 'cladding': return { bucket: 'finish', q: p('length') * p('height') };
    case 'shed_roof': case 'hip_roof': return { bucket: 'roof', q: (p('width') * p('length')) / Math.cos((p('pitch') * Math.PI) / 180) };
    case 'flat_roof': return { bucket: 'roof', q: p('width') * p('length') };
    case 'mansard': {
      const W = p('width'); const L = p('length'); const i = Math.min(p('inset'), Math.min(W, L) * 0.45);
      return { bucket: 'roof', q: (2 * (W + L) - 4 * i) * Math.hypot(i, p('lowerH')) + ((W - 2 * i) * (L - 2 * i)) / Math.cos((p('upperPitch') * Math.PI) / 180) };
    }
    case 'sawtooth': return { bucket: 'roof', q: Math.round(p('teeth')) * Math.hypot(p('width') / Math.round(p('teeth')), p('height')) * p('length') };
    case 'dome': { const a = p('diameter') / 2; const r = Math.min(p('rise'), a); return { bucket: 'roof', q: Math.PI * (a * a + r * r) }; }
    case 'vault': { const { rho, a0, a1 } = arcOf(p('span'), p('rise')); return { bucket: 'roof', q: rho * (a1 - a0) * p('length') }; }
    case 'pergola': {
      const s = p('post');
      const rafters = Math.max(2, Math.floor(p('length') / p('spacing')) + 1);
      return { bucket: 'volume', q: 4 * s * s * p('height') + 2 * s * s * (p('length') + s) + rafters * 0.15 * 0.05 * (p('width') + 0.4) };
    }
    case 'canopy': return { bucket: 'roof', q: p('width') * p('depth') };
    case 'dormer': return { bucket: 'roof', q: (p('width') * p('depth')) / Math.cos((p('pitch') * Math.PI) / 180) };
    case 'double_door': case 'sliding_door': case 'garage_door': return { bucket: 'door', q: p('width') * p('height') };
    case 'sliding_window': return { bucket: 'window', q: p('width') * p('height') };
    case 'skylight': return { bucket: 'glass', q: p('width') * p('length') };
    case 'l_stair': return { bucket: 'volume', q: flightVolume(Math.round(p('stepsA')), p('riser'), p('tread'), p('width')) + flightVolume(Math.round(p('stepsB')), p('riser'), p('tread'), p('width')) + p('width') ** 2 * 0.15 };
    case 'u_stair': return { bucket: 'volume', q: flightVolume(Math.round(p('stepsA')), p('riser'), p('tread'), p('width')) + flightVolume(Math.round(p('stepsB')), p('riser'), p('tread'), p('width')) + (2 * p('width') + 0.1) * p('width') * 0.15 };
    case 'spiral_stair': {
      const count = Math.round(p('steps')); const R = p('diameter') / 2;
      return { bucket: 'volume', q: count * (Math.PI * R * R * (p('turn') / count / 360)) * 0.04 };
    }
    case 'ramp': return { bucket: 'volume', q: p('width') * p('thickness') * Math.hypot(p('length'), p('rise')) };
    case 'railing': {
      if (el.material === 'vidrio') return { bucket: 'glass', q: p('length') * p('height') };
      const a2 = 0.05 * 0.05;
      return { bucket: 'volume', q: 2 * a2 * p('length') + (Math.ceil(p('length') / p('spacing')) + 1) * a2 * p('height') };
    }
    case 'balcony': return { bucket: 'volume', q: p('width') * p('depth') * p('thickness') };
    case 'elevator': return { bucket: 'volume', q: 2 * (p('width') + p('depth')) * p('height') * p('wall') };
    default: return null;
  }
}
