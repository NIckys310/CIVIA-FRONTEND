// Revisión estructural del modelo: comprueba que cada carga tenga un camino continuo hasta el suelo.
//   · Columnas apoyadas en cimentación o en la columna de abajo.
//   · Vigas con sus dos extremos sobre columnas o muros.
//   · Losas con apoyos suficientes, luces razonables y voladizos cortos.
//   · Balcones y voladizos anclados a una losa y con vuelo dentro de lo admisible.
// Es una verificación geométrica de predimensionamiento: no reemplaza el diseño estructural.

const FOUNDATIONS = ['footing', 'strip_footing', 'pile_cap', 'raft'];
const SLABS = ['slab', 'ribbed_slab', 'flat_roof'];
const TOL = 0.06;

const p = (el, k, d) => (Number.isFinite(Number(el.params?.[k])) ? Number(el.params[k]) : d);

/** Huella en planta de un elemento rectangular: [xmin, xmax, zmin, zmax] considerando giros de 90°. */
function footprint(el, w, l) {
  const [x, , z] = el.position;
  const turned = Math.abs(Math.sin(((el.rotation || 0) * Math.PI) / 180)) > 0.5;
  const [a, b] = turned ? [l, w] : [w, l];
  return [x - a / 2, x + a / 2, z - b / 2, z + b / 2];
}

const inside = (fp, x, z, pad = 0) => x >= fp[0] - pad && x <= fp[1] + pad && z >= fp[2] - pad && z <= fp[3] + pad;

export function checkStructure(elements) {
  const columns = elements.filter((e) => e.type === 'column').map((e) => {
    const b = p(e, 'b', 0.4); const h = p(e, 'h', 0.4);
    return { e, x: e.position[0], z: e.position[2], y0: e.position[1], y1: e.position[1] + p(e, 'height', 3), half: Math.max(b, h) / 2 };
  });
  const foundations = elements.filter((e) => FOUNDATIONS.includes(e.type)).map((e) => {
    const w = e.type === 'strip_footing' ? p(e, 'length', 6) : p(e, 'width', 1.6);
    const l = e.type === 'strip_footing' ? p(e, 'width', 0.8) : p(e, 'length', 1.6);
    return { fp: footprint(e, w, l), top: e.position[1] + p(e, 'thickness', 0.4) };
  });
  // Un muro de pañete y pintura es divisorio: no carga. Solo cuentan los de mampostería o concreto.
  const walls = elements.filter((e) => (e.type === 'wall' && e.material !== 'pintura') || e.type === 'retaining_wall').map((e) => {
    const L = p(e, 'length', 4);
    return { fp: footprint(e, L, p(e, 'thickness', 0.2) + 0.1), y0: e.position[1], y1: e.position[1] + p(e, 'height', 2.6) };
  });
  const slabs = elements.filter((e) => SLABS.includes(e.type)).map((e) => {
    const w = p(e, 'width', 5); const l = p(e, 'length', 5);
    return { e, fp: footprint(e, w, l), y0: e.position[1], y1: e.position[1] + p(e, 'thickness', 0.15) + (e.type === 'ribbed_slab' ? p(e, 'ribH', 0.25) : 0) };
  });

  const errors = []; const warnings = []; const ok = [];
  const name = (e, kind) => `${kind} en (${e.position[0].toFixed(1)}; ${e.position[1].toFixed(1)}; ${e.position[2].toFixed(1)}) m`;

  // 1. Columnas
  let grounded = 0; let stacked = 0;
  for (const c of columns) {
    if (Math.abs(c.y0) <= TOL || c.y0 < 0) {
      if (foundations.some((f) => Math.abs(f.top - c.y0) <= TOL && inside(f.fp, c.x, c.z))) grounded++;
      else errors.push(`${name(c.e, 'Columna')}: no tiene zapata ni losa de cimentación debajo.`);
      continue;
    }
    const below = columns.find((o) => o !== c && Math.abs(o.x - c.x) <= TOL && Math.abs(o.z - c.z) <= TOL && c.y0 - o.y1 >= -TOL && c.y0 - o.y1 <= 0.6);
    if (below) { stacked++; continue; }
    const transfer = slabs.some((s) => Math.abs(s.y1 - c.y0) <= TOL && inside(s.fp, c.x, c.z));
    if (transfer) warnings.push(`${name(c.e, 'Columna')}: nace sobre una losa (transferencia). Requiere viga de transferencia diseñada.`);
    else errors.push(`${name(c.e, 'Columna')}: no continúa hasta la cimentación.`);
  }
  if (columns.length) ok.push(`${grounded} columnas sobre cimentación y ${stacked} continuas sobre la columna inferior.`);

  // 2. Vigas
  let beamsOk = 0;
  for (const e of elements.filter((x) => x.type === 'beam')) {
    const L = p(e, 'length', 5); const h = p(e, 'h', 0.5);
    const rot = ((e.rotation || 0) * Math.PI) / 180;
    const dx = (Math.cos(rot) * L) / 2; const dz = (-Math.sin(rot) * L) / 2;
    const yb = e.position[1]; const yt = yb + h;
    const supported = (x, z) => columns.some((c) => Math.abs(c.x - x) <= c.half + TOL && Math.abs(c.z - z) <= c.half + TOL && c.y1 >= yt - 0.6 && c.y0 <= yb + TOL)
      || walls.some((w) => inside(w.fp, x, z, TOL) && w.y1 >= yb - TOL && w.y0 <= yb);
    const ends = [[e.position[0] - dx, e.position[2] - dz], [e.position[0] + dx, e.position[2] + dz]];
    const free = ends.filter(([x, z]) => !supported(x, z)).length;
    if (free === 2) errors.push(`${name(e, 'Viga')}: ninguno de sus extremos se apoya en columnas o muros.`);
    else if (free === 1) errors.push(`${name(e, 'Viga')}: un extremo queda sin apoyo (sería un voladizo no diseñado).`);
    else beamsOk++;
    if (L > 9) warnings.push(`${name(e, 'Viga')}: luz de ${L.toFixed(1)} m; por encima de 9 m conviene una viga postensada o una columna intermedia.`);
    if (h < L / 18.5 - 0.01) (h < L / 24 ? errors : warnings).push(`${name(e, 'Viga')}: peralte ${h.toFixed(2)} m menor que L/18,5 = ${(L / 18.5).toFixed(2)} m.`);
  }
  if (beamsOk) ok.push(`${beamsOk} vigas apoyadas en sus dos extremos.`);

  // 3. Losas y cubiertas planas
  let slabsOk = 0;
  for (const s of slabs) {
    const supports = columns.filter((c) => inside(s.fp, c.x, c.z, 0.3) && c.y1 <= s.y0 + TOL && c.y1 >= s.y0 - 1.6);
    const wallSupport = walls.filter((w) => w.y1 <= s.y0 + TOL && w.y1 >= s.y0 - 0.4 && w.fp[1] >= s.fp[0] && w.fp[0] <= s.fp[1] && w.fp[3] >= s.fp[2] && w.fp[2] <= s.fp[3]);
    if (supports.length + wallSupport.length < 3) {
      errors.push(`${name(s.e, 'Losa')}: tiene ${supports.length + wallSupport.length} apoyos; necesita al menos 3 columnas o muros debajo.`);
      continue;
    }
    if (supports.length) {
      const xs = [...new Set(supports.map((c) => +c.x.toFixed(2)))].sort((a, b) => a - b);
      const zs = [...new Set(supports.map((c) => +c.z.toFixed(2)))].sort((a, b) => a - b);
      const gap = Math.max(...xs.slice(1).map((v, i) => v - xs[i]), ...zs.slice(1).map((v, i) => v - zs[i]), 0);
      if (gap > 9) warnings.push(`${name(s.e, 'Losa')}: luz libre de ${gap.toFixed(1)} m entre apoyos.`);
      const overhang = Math.max(xs[0] - s.fp[0], s.fp[1] - xs[xs.length - 1], zs[0] - s.fp[2], s.fp[3] - zs[zs.length - 1]);
      if (overhang > 2.5) errors.push(`${name(s.e, 'Losa')}: voladizo de ${overhang.toFixed(1)} m; el máximo razonable es 2,5 m.`);
      else if (overhang > 1.6) warnings.push(`${name(s.e, 'Losa')}: voladizo de ${overhang.toFixed(1)} m; verifica deflexiones.`);
      else slabsOk++;
    } else slabsOk++;
  }
  if (slabsOk) ok.push(`${slabsOk} losas con apoyos suficientes y voladizos cortos.`);

  // 4. Balcones y voladizos
  let balconiesOk = 0;
  for (const e of elements.filter((x) => x.type === 'balcony' || x.type === 'cantilever')) {
    const depth = e.type === 'balcony' ? p(e, 'depth', 1.2) : p(e, 'length', 2);
    const anchored = slabs.some((s) => Math.abs(s.y0 - e.position[1]) <= 0.45 && inside(s.fp, e.position[0], e.position[2], 0.35));
    if (!anchored) errors.push(`${name(e, 'Voladizo')}: no está anclado a una losa del mismo nivel.`);
    else if (depth > 2.5) errors.push(`${name(e, 'Voladizo')}: vuelo de ${depth.toFixed(1)} m (máximo 2,5 m).`);
    else if (depth > 2) warnings.push(`${name(e, 'Voladizo')}: vuelo de ${depth.toFixed(1)} m; verifica deflexiones.`);
    else balconiesOk++;
  }
  if (balconiesOk) ok.push(`${balconiesOk} balcones y voladizos anclados y con vuelo admisible.`);

  if (!columns.length && !walls.length) warnings.push('El modelo no tiene columnas ni muros portantes.');
  return { ok, warnings, errors, passed: errors.length === 0 };
}
