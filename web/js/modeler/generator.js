// Generador de edificios estructuralmente coherentes a partir de una descripción o de parámetros.
// Arma una malla de columnas con luces moderadas, zapatas dimensionadas por carga, vigas con peralte
// L/12, losas por piso, núcleo de escaleras (y ascensor desde 5 pisos), fachadas, balcones y cubierta.
// Todo sale como elementos editables del modelador y se verifica con checkStructure().
import { createElement } from './elements.js';

const round = (v, step) => Math.round(v / step) * step;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const KINDS = {
  apartments: { label: 'Edificio de apartamentos', floors: 4, width: 24, depth: 14 },
  tower: { label: 'Torre residencial', floors: 12, width: 14, depth: 14 },
  house: { label: 'Casa contemporánea', floors: 2, width: 13, depth: 10 },
};

/** Lee una descripción libre: "edificio de 8 pisos de 20 x 15 con balcones". */
export function parsePrompt(text) {
  const t = (text || '').toLowerCase();
  const kind = /casa|vivienda unifamiliar|villa/.test(t) ? 'house' : /torre|rascacielos/.test(t) ? 'tower' : 'apartments';
  const floors = Number((t.match(/(\d{1,2})\s*(pisos|niveles|plantas)/) || [])[1]) || null;
  const dims = t.match(/(\d{1,3}(?:[.,]\d+)?)\s*(?:m\s*)?[x×por]\s*(\d{1,3}(?:[.,]\d+)?)/);
  const n = (s) => Number(String(s).replace(',', '.'));
  return { kind, floors, width: dims ? n(dims[1]) : null, depth: dims ? n(dims[2]) : null, balconies: !/sin balc/.test(t) };
}

export function generateBuilding(options = {}) {
  const kind = KINDS[options.kind] ? options.kind : 'apartments';
  const base = KINDS[kind];
  const floors = clamp(Math.round(options.floors || base.floors), 1, kind === 'house' ? 3 : 40);
  const width = clamp(options.width || base.width, 6, 60);
  const depth = clamp(options.depth || base.depth, 6, 40);
  const maxSpan = kind === 'house' ? 6 : 6.5;
  const nx = Math.ceil(width / maxSpan); const nz = Math.ceil(depth / maxSpan);
  const bx = width / nx; const bz = depth / nz;
  const span = Math.max(bx, bz);
  const FH = kind === 'apartments' ? 3.1 : 3.0;
  const groundH = kind === 'apartments' ? 3.5 : FH;
  const level = (k) => (k === 0 ? 0 : groundH + (k - 1) * FH); // cota del piso terminado k

  // Predimensionamiento: carga de servicio ≈ 12 kN/m² por piso, f'c = 21 MPa, suelo 150 kPa.
  const tributary = bx * bz;
  const load = (floors + 1) * tributary * 12;
  const col = clamp(round(Math.max(0.3, Math.sqrt(load / (0.3 * 21000)) + 0.05), 0.05), 0.3, 1.2);
  const beamH = clamp(round(Math.max(0.35, span / 12), 0.05), 0.35, 1);
  const beamB = clamp(round(Math.max(0.25, beamH / 2), 0.05), 0.25, col);
  const slabT = clamp(round(Math.max(0.12, span / 30), 0.01), 0.12, 0.3);
  const padSide = round(Math.sqrt(load / 150) + 0.1, 0.05);
  const useRaft = padSide > Math.min(bx, bz) * 0.8;
  const footT = clamp(round(Math.max(0.4, padSide / 4), 0.05), 0.4, 1.5);

  const els = [];
  const add = (type, position, params, extra = {}) => {
    const e = createElement(type, position, extra.rotation || 0);
    e.params = { ...e.params, ...params };
    if (extra.material) e.material = extra.material;
    els.push(e);
    return e;
  };
  const xs = Array.from({ length: nx + 1 }, (_, i) => -width / 2 + i * bx);
  const zs = Array.from({ length: nz + 1 }, (_, j) => -depth / 2 + j * bz);
  const front = depth / 2; const back = -depth / 2;

  // Cimentación
  if (useRaft) add('raft', [0, -0.6, 0], { width: +(width + 1.2).toFixed(2), length: +(depth + 1.2).toFixed(2), thickness: 0.6 });
  else for (const x of xs) for (const z of zs) add('footing', [x, -footT, z], { width: padSide, length: padSide, thickness: footT });

  for (let k = 1; k <= floors; k++) {
    const y0 = level(k - 1); const top = level(k);
    const slabBase = +(top - slabT).toFixed(3);
    const beamBase = +(slabBase - beamH).toFixed(3);
    for (const x of xs) for (const z of zs) add('column', [x, y0, z], { shape: 'rect', b: col, h: col, height: +(slabBase - y0).toFixed(3) });
    for (const z of zs) for (let i = 0; i < nx; i++) add('beam', [+(xs[i] + bx / 2).toFixed(3), beamBase, z], { profile: 'rect', b: beamB, h: beamH, length: +bx.toFixed(3) });
    for (const x of xs) for (let j = 0; j < nz; j++) add('beam', [x, beamBase, +(zs[j] + bz / 2).toFixed(3)], { profile: 'rect', b: beamB, h: beamH, length: +bz.toFixed(3) }, { rotation: 90 });
    const roof = k === floors;
    const over = kind === 'house' && roof ? 1.2 : 0.3;
    if (roof) add('flat_roof', [0, slabBase, 0], { width: +(width + over * 2).toFixed(2), length: +(depth + over * 2).toFixed(2), thickness: slabT, parapet: kind === 'house' ? 0.25 : 1.0 });
    else add('slab', [0, slabBase, 0], { width: +(width + col).toFixed(2), length: +(depth + col).toFixed(2), thickness: slabT });

    // Fachadas: el primer piso del edificio de apartamentos queda libre (parqueaderos) salvo el fondo.
    const wallH = +(beamBase - y0).toFixed(3);
    const openFront = kind === 'apartments' && k === 1;
    for (let i = 0; i < nx; i++) {
      const x = +(xs[i] + bx / 2).toFixed(3);
      if (!openFront) {
        if (kind === 'house' && k === 1 && i === 0) {
          add('wall', [x, y0, front], { length: +(bx - col).toFixed(3), height: wallH, thickness: 0.15 }, { material: 'pintura' });
          add('door', [x - bx / 4, y0, front], { width: 1.0, height: 2.2, depth: 0.15 });
          add('sliding_window', [x + bx / 6, y0, front], { width: 2.2, height: 1.6, sill: 0.6, depth: 0.15 });
        } else {
          add('curtain_wall', [x, y0, front], { length: +(bx - col).toFixed(3), height: wallH, modX: 1.3, modY: Math.min(1.5, wallH), mullion: 0.06, depth: 0.12 });
        }
      }
      add('wall', [x, y0, back], { length: +(bx - col).toFixed(3), height: wallH, thickness: 0.15 }, { material: 'pintura' });
      add('window', [x, y0, back], { width: Math.min(2.4, +(bx - col - 0.8).toFixed(2)), height: 1.3, sill: 0.9, depth: 0.15 });
    }
    for (const x of [xs[0], xs[nx]]) for (let j = 0; j < nz; j++) {
      const z = +(zs[j] + bz / 2).toFixed(3);
      add('wall', [x, y0, z], { length: +(bz - col).toFixed(3), height: wallH, thickness: 0.15 }, { rotation: 90, material: 'pintura' });
      add('window', [x, y0, z], { width: Math.min(1.8, +(bz - col - 1).toFixed(2)), height: 1.3, sill: 0.9, depth: 0.15 }, { rotation: 90 });
    }
    // Balcones en voladizo sobre la fachada principal (vuelo 1,5 m, anclados a la losa del piso).
    if (k > 1 && options.balconies !== false && kind !== 'house') {
      for (let i = 0; i < nx; i++) {
        if ((i + k) % 2 && kind === 'tower') continue;
        add('balcony', [+(xs[i] + bx / 2).toFixed(3), +(level(k - 1) - slabT).toFixed(3), +(front + col / 2).toFixed(3)], { width: +(bx - 0.4).toFixed(2), depth: 1.5, thickness: slabT, rail: 1.05 });
      }
    }
  }
  if (kind === 'house' && floors > 1) {
    add('balcony', [0, +(level(1) - slabT).toFixed(3), +(front + col / 2).toFixed(3)], { width: +Math.min(8, width * 0.6).toFixed(2), depth: 1.5, thickness: slabT, rail: 1.05 });
  }

  // Núcleo de circulación en la crujía trasera izquierda.
  const stairX = xs[0] + col / 2 + 0.3; const stairZ = back + col / 2 + 0.3;
  for (let k = 1; k < floors; k++) {
    const h = level(k) - level(k - 1);
    const steps = Math.ceil(h / 2 / 0.18);
    add('u_stair', [stairX, level(k - 1), stairZ], { width: 1.1, stepsA: steps, stepsB: steps, riser: +(h / 2 / steps).toFixed(4), tread: 0.28 });
  }
  if (floors >= 5 && nx >= 2) add('elevator', [+(xs[1] + bx / 2).toFixed(3), 0, +(back + 1.4).toFixed(3)], { width: 2, depth: 2, height: +(level(floors) + 1.2).toFixed(2), wall: 0.2 });
  if (kind === 'apartments') add('pergola', [0, level(floors), 0], { width: Math.min(12, +(width * 0.5).toFixed(1)), length: Math.min(20, +(depth * 0.6).toFixed(1)), height: 2.6, post: 0.15, spacing: 0.6 }, { material: 'acero' });

  return {
    model: { version: 1, elements: els },
    summary: {
      kind: base.label, floors, width, depth, grid: `${nx} × ${nz} luces de ${bx.toFixed(2)} × ${bz.toFixed(2)} m`,
      column: `${col.toFixed(2)} × ${col.toFixed(2)} m`, beam: `${beamB.toFixed(2)} × ${beamH.toFixed(2)} m`, slab: `${slabT.toFixed(2)} m`,
      foundation: useRaft ? 'losa de cimentación de 0,60 m' : `zapatas de ${padSide.toFixed(2)} × ${padSide.toFixed(2)} × ${footT.toFixed(2)} m`,
      height: level(floors),
    },
  };
}
