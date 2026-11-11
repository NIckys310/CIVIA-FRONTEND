// Utilidades de interfaz. Todo texto dinámico pasa por `html` (escapa) salvo lo envuelto en raw().

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"'`]/g, (c) => ESC[c]);

class Raw { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Raw(String(s ?? ''));

const render = (v) => {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return esc(v);
};

/** Plantilla segura: interpola escapando HTML. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return raw(out);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function mount(el, content) {
  el.innerHTML = content instanceof Raw ? content.s : esc(content);
  return el;
}

export function on(root, event, selector, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}

export const debounce = (fn, ms = 250) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

// ------------------------------------------------------------------ íconos (trazo fino, estilo plano)
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  projects: '<path d="M3 7h7l2 2h9v11H3z"/><path d="M3 7V4h6l2 3"/>',
  plan: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h6v12M9 13h12M14 3v10"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  ai: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><path d="m12 7 1.6 3.4L17 12l-3.4 1.6L12 17l-1.6-3.4L7 12l3.4-1.6z"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8M8 11h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.3 2.6 3.8 5.5"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  ruler: '<path d="m3 17 14-14 4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  tasks: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="m7 9 1.5 1.5L11 8M7 15l1.5 1.5L11 14M14 9h4M14 15h4"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="1.5"/><path d="M3 10h18M16 15h2"/><path d="M6 6V4h12v2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  send: '<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>',
  clip: '<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.2 17.2a1.7 1.7 0 0 1-2.4-2.4L15 6.6"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  columns: '<path d="M4 21h16M5 18h14M6 18V8M10 18V8M14 18V8M18 18V8M3 8h18L12 3z"/>',
  beam: '<path d="M3 7h18v3H3zM6 10v11M18 10v11M3 21h18"/>',
  brick: '<rect x="3" y="5" width="18" height="14"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
  pipe: '<path d="M3 8h8a3 3 0 0 1 3 3v10M3 12h6a1 1 0 0 1 1 1v8M14 21h4M8 21h4"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-15-1 9-6 15-15 15z"/><path d="M5 19 13 11"/>',
  map: '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4V3h6v1M8 10h8M8 14h8M8 18h5"/>',
  lamp: '<path d="M8 3h8l3 8H5z"/><path d="M12 11v8M8 21h8"/>',
  blueprint: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h6v12M9 13h12M14 3v10"/>',
  compassArch: '<circle cx="12" cy="5" r="2"/><path d="m11 7-5 14M13 7l5 14M8 15h8"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5M8 9h8M8 13h4"/>',
  cut: '<path d="M3 12h18"/><path d="M6 6l12 12M6 18 18 6" opacity=".35"/>',
  wire: '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 18 10M21 7 3 17M12 2v20"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  building: '<path d="M4 21V5l8-3v19M12 8l8 3v10M2 21h20"/><path d="M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>',
  refresh: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  flash: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  switch: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  foundation: '<path d="M3 20h18"/><path d="M6 20v-4h12v4"/><path d="M10 16V6h4v10"/>',
  pile: '<path d="M4 6h16"/><path d="M9 6v13l3 3 3-3V6"/>',
  retaining: '<path d="M7 3v14"/><path d="M11 3v14"/><path d="M3 21v-4h16v4z"/><path d="M15 12l6 5"/>',
  ribbed: '<path d="M2 7h20v3H2z"/><path d="M5 10v8M12 10v8M19 10v8"/>',
  truss: '<path d="M2 18h20L12 6z"/><path d="M12 6v12M7 12l2 6M17 12l-2 6"/>',
  arch: '<path d="M4 21v-8a8 8 0 0 1 16 0v8"/><path d="M8.5 21v-8a3.5 3.5 0 0 1 7 0v8"/><path d="M2 21h20"/>',
  portal: '<path d="M3 6h18v4H3z"/><path d="M5 10v11h3V10M16 10v11h3V10"/>',
  brace: '<path d="M4 4h16v16H4z"/><path d="m4 4 16 16M20 4 4 20"/>',
  cantilever: '<path d="M4 3v18"/><path d="M4 8h16v2L4 14"/>',
  corbel: '<path d="M5 3v18"/><path d="M5 7h13v5L5 19"/>',
  partition: '<path d="M3 21V4h18v17"/><path d="M12 4v17"/><path d="M2 21h20"/>',
  curtain: '<path d="M4 3h16v18H4z"/><path d="M9.3 3v18M14.6 3v18M4 9h16M4 15h16"/>',
  parapet: '<path d="M2 21h20"/><path d="M4 21v-9h16v9"/><path d="M3 12V9h18v3"/>',
  lattice: '<path d="M4 4h16v16H4z"/><path d="M8 4v16M12 4v16M16 4v16"/>',
  brise: '<path d="M4 3v18M20 3v18"/><path d="m4 7 16 3M4 12l16 3M4 17l16 3"/>',
  chimney: '<path d="M2 21 12 13l10 8"/><path d="M15 15V5h4v13"/><path d="M14 5h6"/>',
  ceiling: '<path d="M3 5h18"/><path d="M4 9h16"/><path d="M12 9v5"/><circle cx="12" cy="16.5" r="2.5"/>',
  floor: '<path d="M6 8h12l4 12H2z"/><path d="M12 8v12M4 14h16"/>',
  cladding: '<path d="M4 3h16v18H4z"/><path d="M4 8h16M4 13h16M4 18h16M10 3v5M15 8v5M9 13v5"/>',
  shedroof: '<path d="m2 13 20-8"/><path d="M5 12v9h15V6.5"/>',
  hiproof: '<path d="M9 6h6l7 9H2z"/><path d="M4 15v6h16v-6"/>',
  flatroof: '<path d="M2 8h20v3H2z"/><path d="M2 8V5M22 8V5"/><path d="M4 11v10h16V11"/>',
  mansard: '<path d="M3 21 6 11l3-5h6l3 5 3 10"/><path d="M6 11h12"/>',
  sawtooth: '<path d="M2 20V14l6-6v6l6-6v6l6-6v12z"/>',
  dome: '<path d="M3 16a9 9 0 0 1 18 0"/><path d="M2 16h20"/><path d="M5 16v5h14v-5"/><path d="M12 7V4"/>',
  vault: '<path d="M3 20v-8a9 8 0 0 1 18 0v8"/><path d="M8 20v-8a4 5 0 0 1 8 0v8"/><path d="M12 4v3"/>',
  pergola: '<path d="M5 8v13M19 8v13"/><path d="M2 8h20"/><path d="M6 5v3M12 5v3M18 5v3"/>',
  canopy: '<path d="M4 3v18"/><path d="M4 12h15l-1 2H4"/><path d="m4 5 13 7"/>',
  dormer: '<path d="m2 20 10-14 10 14"/><path d="M9 20v-6l3-3 3 3v6z"/>',
  doubledoor: '<path d="M3 21V3h18v18"/><path d="M12 3v18"/><path d="M1 21h22"/><circle cx="9.5" cy="12" r=".7" fill="currentColor"/><circle cx="14.5" cy="12" r=".7" fill="currentColor"/>',
  slidingdoor: '<path d="M3 21V3h18v18"/><path d="M10 3v18M14 3v18"/><path d="M15 12h4m-2-2 2 2-2 2"/>',
  garage: '<path d="m2 9 10-6 10 6v12H2z"/><path d="M6 21V11h12v10"/><path d="M6 14h12M6 17.5h12"/>',
  slidingwindow: '<path d="M3 5h18v14H3z"/><path d="M11 5v14M13 5v14"/><path d="M15 12h4m-2-2 2 2-2 2"/>',
  skylight: '<path d="M3 14 9 6h12l-6 8z"/><path d="M12 6l-3 8"/><path d="M6 18l-1 3M12 18l-1 3M18 18l-1 3"/>',
  lstair: '<path d="M3 21h5v-4h4v-4h4V9h5"/><path d="M21 9V3"/>',
  ustair: '<path d="M5 21V8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v13"/><path d="M5 15h3M5 10h3M16 10h3M16 15h3"/>',
  spiral: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.5"/><path d="M12 3v7.5M21 12h-7.5M12 21v-7.5M3 12h7.5"/>',
  ramp: '<path d="M2 20h20L2 9z"/>',
  railing: '<path d="M3 7h18"/><path d="M5 7v14M12 7v14M19 7v14"/><path d="M3 15h18"/>',
  balcony: '<path d="M5 3h14v9H5z"/><path d="M12 3v9"/><path d="M2 15h20"/><path d="M4 15v6M9 15v6M15 15v6M20 15v6M2 21h20"/>',
  elevator: '<path d="M5 3h14v18H5z"/><path d="M12 8v13"/><path d="m8.5 6.5 1.5-2 1.5 2M12.5 4.5l1.5 2 1.5-2"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  move: '<path d="M12 3v18M3 12h18"/><path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
  redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  report: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0"/>',
  roof: '<path d="M2 12 12 4l10 8"/><path d="M5 10v10h14V10"/>',
  stairs: '<path d="M3 20h4v-4h4v-4h4V8h4V4"/><path d="M3 20h18"/>',
  window: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 4v16M4 12h16"/>',
  door: '<path d="M5 21V3h11v18"/><path d="M3 21h18"/><circle cx="13" cy="12" r=".8" fill="currentColor"/>',
  eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.1 4M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v4h4"/><path d="M12 7v5l3 2"/>',
  bookmark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  thumbdown: '<path d="M7 14V4H4v10z"/><path d="M7 14l4 7c1.6 0 2.5-1 2.2-2.6L12.6 15H19a2 2 0 0 0 2-2.3l-1.2-7A2 2 0 0 0 17.8 4H7"/>',
  thumbup: '<path d="M7 10v10H4V10z"/><path d="M7 10l4-7c1.6 0 2.5 1 2.2 2.6L12.6 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  helmet: '<path d="M4 16a8 8 0 0 1 16 0"/><path d="M2 16h20v2H2z"/><path d="M10 8.3V5h4v3.3"/>',
  bridge: '<path d="M2 17h20M2 12h20"/><path d="M4 12c3-5 13-5 16 0"/><path d="M6 12v5M10 9.5V17M14 9.5V17M18 12v5"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  road: '<path d="M8 3 4 21M16 3l4 18"/><path d="M12 4v3M12 10.5v3M12 17v3"/>',
  drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  mountain: '<path d="m2 20 7-12 4 6 3-4 6 10z"/><path d="m9 8 2 3.5"/>',
  // Mobiliario
  kitchen: '<path d="M3 11h18v9H3z"/><path d="M3 14h18M9 14v6M15 14v6"/><path d="M5 4h14v4H5z"/><path d="M14 11V9.5a1.5 1.5 0 0 1 3 0"/>',
  fridge: '<rect x="6" y="2.5" width="12" height="19" rx="1.5"/><path d="M6 9h12M9 5.5v1.5M9 11.5v3"/>',
  stove: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M4 9h16"/><circle cx="8.5" cy="6" r="1.2"/><circle cx="15.5" cy="6" r="1.2"/><rect x="7" y="12" width="10" height="6" rx="1"/>',
  toilet: '<path d="M7 3h10v6H7z"/><path d="M5 9h14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z"/><path d="M9 15l-1 6h8l-1-6"/>',
  sink: '<path d="M3 11h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M12 11V6a2 2 0 0 1 4 0"/><path d="M10 21h4M12 18v3"/>',
  shower: '<path d="M5 21V6a3 3 0 0 1 6 0"/><path d="M8 9h6l-1 2H9z"/><path d="M9.5 14v.5M12 14v1M14.5 14v.5M10.5 17v.5M13.5 17v.5"/>',
  bath: '<path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V5.5a2 2 0 0 1 3.7-1"/><path d="M7 20l-1 2M17 20l1 2"/>',
  bed: '<path d="M3 19V6M21 19v-5M3 14h18M3 11h18v3"/><path d="M6 11V9a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 9v2"/>',
  drawer: '<rect x="5" y="4" width="14" height="14" rx="1.5"/><path d="M5 11h14M10.5 7.5h3M10.5 14.5h3M7 18v2M17 18v2"/>',
  wardrobe: '<rect x="4" y="2.5" width="16" height="18" rx="1"/><path d="M12 2.5v18M10 10v3M14 10v3M6 20.5V22M18 20.5V22"/>',
  desk: '<path d="M3 9h18M5 9v11M19 9v11M13 9v6h6"/><rect x="8" y="3" width="8" height="5" rx=".5"/>',
  sofa: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v5H3z"/><path d="M5 18v2M19 18v2"/>',
  table: '<path d="M2 9h20M5 9l-1 11M19 9l1 11M7 14h10"/>',
  tv: '<rect x="2.5" y="4" width="19" height="12" rx="1"/><path d="M8 20h8M12 16v4"/>',
  shelf: '<path d="M4 3v18M20 3v18M4 8h16M4 14h16M4 20h16"/><path d="M7 8V4.5M9 8V5M14 14v-4M16.5 14l1-3.5"/>',
  rug: '<rect x="4" y="5" width="16" height="14" rx="1"/><rect x="7" y="8" width="10" height="8"/><path d="M2 7h2M2 12h2M2 17h2M20 7h2M20 12h2M20 17h2"/>',
  plant: '<path d="M8 15h8l-1 6H9z"/><path d="M12 15V8M12 11c-3 0-5-2-5-5 3 0 5 2 5 5zM12 9c0-3 2-5 5-5 0 3-2 5-5 5z"/>',
};

export function icon(name, cls = '') {
  return raw(`<svg class="${esc(cls)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.file}</svg>`);
}

// ------------------------------------------------------------------ formato
const dateFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtDate = (d) => (d ? dateFmt.format(new Date(d)) : '—');
export const fmtDateTime = (d) => (d ? dateTimeFmt.format(new Date(d)) : '—');
export function relTime(d) {
  if (!d) return '';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `hace ${Math.floor(s / 86400)} d`;
  return fmtDate(d);
}
export function fmtBytes(b) {
  if (!b && b !== 0) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
export function fmtMoney(v, currency = 'COP') {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: currency === 'COP' ? 0 : 2 }).format(n);
  } catch {
    return n.toLocaleString('es');
  }
}
export const fmtNum = (v, d = 2) => Number(v || 0).toLocaleString('es', { maximumFractionDigits: d });
export const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export function avatar(name, color, cls = '') {
  return html`<span class="avatar ${cls}" style="background:${raw(safeColor(color))}" title="${name}">${initials(name)}</span>`;
}
export const safeColor = (c) => (/^#[0-9a-fA-F]{3,8}$/.test(c || '') ? c : '#C9A46A');

// ------------------------------------------------------------------ markdown seguro
/** Convierte Markdown ligero a HTML. Primero escapa todo; luego aplica formato. */
export function markdown(src) {
  const lines = esc(src || '').replace(/\r/g, '').split('\n');
  const out = [];
  let list = null;
  let table = null;
  const inline = (t) => t
    .replace(/&#96;((?:(?!&#96;).)+)&#96;/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:]|$)/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>')
    // Enlaces solo http(s), abiertos aparte y sin pasar el origen.
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)"]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\[(\d{1,3})\]/g, '<span class="cite">$1</span>');
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const closeTable = () => {
    if (table) {
      const [head, ...rows] = table;
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      table = null;
    }
  };
  let code = null;
  for (const line of lines) {
    const t = line.trim();
    // Bloques de código ```lenguaje … ``` (el contenido ya viene escapado: ` es &#96;).
    if (t.startsWith('&#96;&#96;&#96;')) {
      if (code) {
        out.push(`<pre class="code"${code.lang ? ` data-lang="${code.lang}"` : ''}><button type="button" class="code-copy" data-code-copy aria-label="Copiar código">Copiar</button><code>${code.lines.join('\n')}</code></pre>`);
        code = null;
      } else {
        closeList();
        closeTable();
        code = { lang: t.slice(15).trim().replace(/[^\w+#.-]/g, '').slice(0, 20), lines: [] };
      }
      continue;
    }
    if (code) { code.lines.push(line); continue; }
    if (/^\|.*\|$/.test(t)) {
      closeList();
      const cells = t.slice(1, -1).split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      (table ||= []).push(cells);
      continue;
    }
    closeTable();
    let m;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      closeList();
      out.push('<hr>');
    } else if ((m = t.match(/^(#{1,4})\s+(.*)$/))) {
      closeList();
      const level = Math.min(4, m[1].length + 1);
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = t.match(/^[-*]\s+\[( |x)\]\s+(.*)$/i))) {
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li><span class="task-box${m[1].toLowerCase() === 'x' ? ' done' : ''}"></span>${inline(m[2])}</li>`);
    } else if ((m = t.match(/^[-*•]\s+(.*)$/))) {
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = t.match(/^\d+[.)]\s+(.*)$/))) {
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = t.match(/^&gt;\s?(.*)$/))) {
      closeList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if (t === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(t)}</p>`);
    }
  }
  // Un bloque sin cerrar (por ejemplo, mientras llega una respuesta en streaming) se muestra igual.
  if (code) out.push(`<pre class="code"><code>${code.lines.join('\n')}</code></pre>`);
  closeList();
  closeTable();
  return raw(out.join(''));
}

// ------------------------------------------------------------------ toasts y modales
export function toast(message, type = 'ok') {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const ms = type === 'error' ? 6000 : 3600;
  el.innerHTML = `${icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check')}<span>${esc(message)}</span><i class="toast-timer" style="animation-duration:${ms}ms"></i>`;
  box.appendChild(el);
  const dismiss = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 340);
  };
  setTimeout(dismiss, ms);
  el.addEventListener('click', dismiss, { once: true });
}

/** Abre un modal. `body` es html``; devuelve { el, close }. */
export function modal({ title, eyebrow, body, foot, wide = false, onClose }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="card modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="card-head"><div>${eyebrow ? `<div class="eyebrow gold" style="margin-bottom:8px">${esc(eyebrow)}</div>` : ''}<h2>${esc(title)}</h2></div>
    <button class="btn ghost icon sm" data-close aria-label="Cerrar">${icon('x')}</button></div>
    <div class="card-body">${body instanceof Raw ? body.s : esc(body)}</div>
    ${foot ? `<div class="modal-foot">${foot instanceof Raw ? foot.s : esc(foot)}</div>` : ''}</div>`;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', key);
    back.classList.add('closing');
    setTimeout(() => back.remove(), 260);
    onClose?.();
  };
  const key = (e) => { if (e.key === 'Escape') close(); };
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  back.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', key);
  document.body.appendChild(back);
  setTimeout(() => back.querySelector('input, textarea, select')?.focus(), 50);
  return { el: back, close };
}

export function confirmDialog(title, text, okLabel = 'Confirmar', danger = false) {
  return new Promise((resolve) => {
    let done = false;
    const m = modal({
      title,
      body: html`<p class="muted">${text}</p>`,
      foot: html`<button class="btn ghost" data-no>Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" data-yes>${okLabel}</button>`,
      onClose: () => { if (!done) resolve(false); },
    });
    m.el.querySelector('[data-no]').onclick = () => { done = true; m.close(); resolve(false); };
    m.el.querySelector('[data-yes]').onclick = () => { done = true; m.close(); resolve(true); };
  });
}

/** Botón con estado de carga mientras corre una promesa. */
export async function busy(button, fn) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `<span class="spinner"></span>${button.dataset.busy ? `<span>${esc(button.dataset.busy)}</span>` : ''}`;
  try {
    return await fn();
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

/** Confirma en el propio botón que la acción terminó bien y lo devuelve a su estado. */
export function flashDone(button, label = 'Guardado') {
  if (!button?.isConnected || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const original = button.innerHTML;
  button.classList.add('done');
  button.innerHTML = `<svg class="done-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path pathLength="1" d="M5 12.5 10 17.5 19 7"/></svg><span>${esc(label)}</span>`;
  setTimeout(() => { if (button.isConnected) { button.innerHTML = original; button.classList.remove('done'); } }, 1300);
}

export const formData = (form) => Object.fromEntries(new FormData(form).entries());

// ------------------------------------------------------------------ portadas arquitectónicas
/** Dibujo lineal (alzado de edificio) determinista a partir de una semilla. */
export function coverArt(seed, color = '#C9A46A') {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
  const c = safeColor(color);
  const floors = 3 + Math.floor(rnd() * 6);
  const bays = 4 + Math.floor(rnd() * 5);
  const w = 200 + rnd() * 120;
  const fh = 14 + rnd() * 6;
  const x0 = 300 - w / 2 + (rnd() - 0.5) * 80;
  const base = 170;
  let lines = '';
  // pathLength="1" permite "dibujar" cada trazo con CSS (stroke-dashoffset de 1 a 0).
  for (let f = 0; f <= floors; f++) lines += `<path pathLength="1" style="--d:${f}" d="M${x0} ${base - f * fh}H${x0 + w}"/>`;
  for (let b = 0; b <= bays; b++) lines += `<path pathLength="1" style="--d:${b}" d="M${x0 + (b * w) / bays} ${base}V${base - floors * fh}"/>`;
  const cant = rnd() > 0.5 ? `<path pathLength="1" style="--d:${floors}" d="M${x0 + w * 0.55} ${base - floors * fh}h${w * 0.65}v${fh}h-${w * 0.65}"/>` : '';
  return raw(`<svg viewBox="0 0 600 180" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><radialGradient id="g${Math.abs(h % 1e6)}" cx="70%" cy="10%" r="80%"><stop offset="0" stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
    <rect width="600" height="180" fill="#0a0c10"/><rect width="600" height="180" fill="url(#g${Math.abs(h % 1e6)})"/>
    <g stroke="rgba(255,255,255,.05)">${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 50} 0V180"/>`).join('')}${Array.from({ length: 4 }, (_, i) => `<path d="M0 ${i * 50}H600"/>`).join('')}</g>
    <g class="lines" fill="none" stroke="${c}" stroke-opacity=".75" stroke-width="1">${lines}${cant}</g>
    <path d="M0 ${base}H600" stroke="rgba(255,255,255,.25)"/></svg>`);
}

export const STATUS_LABEL = {
  PLANNING: 'Planeación', DESIGN: 'Diseño', PERMITS: 'Licencias', CONSTRUCTION: 'Construcción', COMPLETED: 'Terminado', ON_HOLD: 'En pausa',
};
export const KIND_LABEL = { PLAN: 'Plano', MODEL_3D: 'Modelo 3D', PHOTO: 'Foto', DOCUMENT: 'Documento' };
export const KIND_PLURAL = { PLAN: 'Planos', MODEL_3D: 'Modelos 3D', PHOTO: 'Fotos', DOCUMENT: 'Documentos' };
