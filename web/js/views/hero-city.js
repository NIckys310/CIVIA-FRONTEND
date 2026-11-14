// Escena del panel de inicio: una ciudad que se traza como un plano y cobra vida. Edificios, casas,
// una obra con grúa, calle con tráfico y cielo según la hora. Todo es SVG generado de forma determinista.

const GROUND = 292;

function rng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

// Mismo entorno que el acceso: en tema oscuro, la hora dorada del atardecer; en tema claro, de día.
const sky = () => (document.documentElement.dataset.theme === 'light' ? 'day' : 'dusk');

/** Rejilla de ventanas; unas pocas se encienden y apagan para no recargar la animación. */
function windows(r, x, y, cols, rows, cw, ch, gapX, gapY, lit) {
  let out = '';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const on = r() < lit;
    const blink = on && r() < 0.2;
    const px = x + i * (cw + gapX); const py = y + j * (ch + gapY);
    out += `<rect x="${px}" y="${py}" width="${cw}" height="${ch}" class="w${on ? ' on' : ''}${blink ? ' blink' : ''}"${blink ? ` style="animation-delay:-${(r() * 9).toFixed(1)}s"` : ''}/>`;
  }
  return out;
}

/** Edificio: su contorno se traza primero y después aparece el volumen con sus ventanas. */
const building = (d, delay, path, body) => `<g class="hc-b" style="--d:${delay}s"><g class="hc-solid">${body}</g><path class="hc-line" pathLength="1" d="${path}"/></g>`;
const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
const outline = (x, y, w, h) => `M${x} ${y + h}V${y}H${x + w}V${y + h}`;

function farLayer(r) {
  let body = '';
  let x = 0;
  while (x < 1200) {
    const w = 26 + Math.floor(r() * 46);
    const h = 60 + Math.floor(r() * 130);
    body += `<rect x="${x}" y="${GROUND - h}" width="${w}" height="${h}"/>`;
    if (r() < 0.25) body += `<rect x="${x + w / 2}" y="${GROUND - h - 16}" width="1.5" height="16"/>`;
    x += w + Math.floor(r() * 8);
  }
  return `<g class="hc-layer hc-far" data-depth="5">${body}</g>`;
}

function construction() {
  const x = 650; const w = 88; const floorH = 24; const floors = 7;
  let slabs = '';
  for (let i = 0; i <= floors; i++) {
    const y = GROUND - i * floorH;
    slabs += `<g class="hc-floor" style="--f:${i}"><rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="3" fill="#8f97a3"/>`;
    if (i < floors) for (const cx of [x + 2, x + w / 2 - 2, x + w - 6]) slabs += `<rect x="${cx}" y="${y - floorH}" width="4" height="${floorH}" fill="#5f6875"/>`;
    if (i > 0 && i < floors - 1) slabs += `<rect x="${x + 8}" y="${y - floorH + 3}" width="${w - 16}" height="${floorH - 6}" fill="url(#hc-glass)" opacity="0.55"/>`;
    slabs += '</g>';
  }
  const top = GROUND - floors * floorH;
  let scaffold = '';
  for (let i = 0; i < floors; i++) {
    const y = GROUND - i * floorH;
    scaffold += `<path d="M${x + w + 6} ${y}V${y - floorH}M${x + w + 16} ${y}V${y - floorH}M${x + w + 6} ${y}L${x + w + 16} ${y - floorH}M${x + w + 6} ${y - floorH}H${x + w + 16}"/>`;
  }
  const mast = 766; const craneTop = top - 66;
  let lattice = '';
  for (let y = GROUND; y > craneTop; y -= 14) lattice += `<path d="M${mast} ${y}L${mast + 9} ${y - 14}M${mast + 9} ${y}L${mast} ${y - 14}"/>`;
  return `<g class="hc-site">${slabs}<g class="hc-scaffold">${scaffold}</g>
    <circle class="hc-spark" cx="${x + 22}" cy="${top - 2}" r="2.4"/>
    <g class="hc-crane"><rect x="${mast}" y="${craneTop}" width="1.4" height="${GROUND - craneTop}"/><rect x="${mast + 8}" y="${craneTop}" width="1.4" height="${GROUND - craneTop}"/>
      <g class="hc-lattice">${lattice}</g>
      <rect x="${mast - 8}" y="${craneTop - 11}" width="26" height="11" rx="1.5" class="hc-cab"/>
      <path class="hc-jib" d="M${mast + 26} ${craneTop - 12}H${mast - 130}L${mast + 4} ${craneTop - 34}L${mast + 26} ${craneTop - 12}M${mast + 4} ${craneTop - 34}V${craneTop - 12}"/>
      <rect x="${mast + 14}" y="${craneTop - 11}" width="16" height="9" class="hc-cab"/>
      <circle class="hc-beacon" cx="${mast + 4}" cy="${craneTop - 36}" r="2.2"/>
      <g class="hc-trolley" style="--mast:${mast}"><rect x="${mast - 62}" y="${craneTop - 13}" width="10" height="4" class="hc-cab"/>
        <rect class="hc-cable" x="${mast - 57.5}" y="${craneTop - 9}" width="1" height="60"/>
        <g class="hc-load"><path d="M${mast - 57} ${craneTop + 51}l-11 8h22z" class="hc-sling"/><rect x="${mast - 74}" y="${craneTop + 59}" width="34" height="6" rx="1" fill="#b7bdc7"/></g></g>
    </g></g>`;
}

function midLayer(r, lit) {
  const glassTower = building('tower', 0.15,
    `M804 ${GROUND}V60H826V40H868V60H892V${GROUND}M847 40V8`,
    `${rect(804, 60, 88, GROUND - 60, 'url(#hc-a)')}${rect(826, 40, 42, 20, 'url(#hc-a)')}<g clip-path="url(#hc-clip-tower)">${windows(r, 811, 70, 8, 26, 6, 5, 3.6, 3.6, lit)}
      <rect class="hc-glint" x="760" y="30" width="46" height="280" fill="url(#hc-glint)"/></g>${rect(846.2, 8, 1.6, 32, '#8f97a3')}<circle class="hc-beacon" cx="847" cy="7" r="2.6"/>`);
  const chamfer = building('chamfer', 0.35,
    `M898 ${GROUND}V122L966 86V${GROUND}`,
    `<path d="M898 ${GROUND}V122L966 86V${GROUND}z" fill="url(#hc-b)"/><g clip-path="url(#hc-clip-chamfer)">${windows(r, 904, 92, 6, 21, 6, 6, 4.4, 4, lit)}</g>`);
  let balconies = '';
  for (let j = 0; j < 8; j++) for (let i = 0; i < 5; i++) balconies += `<rect x="${976 + i * 20}" y="${GROUND - 148 + j * 18 + 11}" width="15" height="2" fill="#aeb5c0"/>`;
  const block = building('block', 0.55,
    outline(972, GROUND - 160, 106, 160),
    `${rect(972, GROUND - 160, 106, 160, 'url(#hc-c)')}${windows(r, 979, GROUND - 150, 5, 8, 11, 9, 9, 9, lit)}${balconies}`);
  let columns = '';
  for (let i = 0; i < 7; i++) columns += `<rect x="${1094 + i * 15}" y="${GROUND - 60}" width="6" height="60" fill="#c9c4b8"/>`;
  const civic = building('civic', 0.75,
    `M1084 ${GROUND}V${GROUND - 70}H1198V${GROUND}M1106 ${GROUND - 88}A35 35 0 0 1 1176 ${GROUND - 88}M1141 ${GROUND - 123}V${GROUND - 140}`,
    `${rect(1086, GROUND - 62, 110, 62, 'url(#hc-c)')}${columns}${rect(1084, GROUND - 72, 114, 10, '#b7b2a6')}${rect(1104, GROUND - 88, 74, 16, '#918c80')}
     <path d="M1106 ${GROUND - 88}A35 35 0 0 1 1176 ${GROUND - 88}z" fill="url(#hc-dome)"/>${rect(1140.2, GROUND - 140, 1.6, 18, '#d6a46c')}<circle cx="1141" cy="${GROUND - 141}" r="2.4" fill="#f2cf9f"/>`);
  const west = building('west', 0.95,
    outline(556, GROUND - 190, 74, 190),
    `${rect(556, GROUND - 190, 74, 190, 'url(#hc-b)')}${windows(r, 563, GROUND - 180, 6, 19, 6, 6, 4.2, 3.6, lit)}`);
  const low = building('low', 1.1,
    outline(446, GROUND - 112, 96, 112),
    `${rect(446, GROUND - 112, 96, 112, 'url(#hc-a)')}${windows(r, 454, GROUND - 102, 8, 10, 6, 6, 4.8, 4.2, lit)}`);
  return `<g class="hc-layer hc-mid" data-depth="11">${low}${west}${construction()}${glassTower}${chamfer}${block}${civic}</g>`;
}

const tree = (x, s, delay) => `<g class="hc-tree" style="animation-delay:-${delay}s"><rect x="${x - 1.3}" y="${GROUND - 20 * s}" width="2.6" height="${20 * s}" fill="#4a3d2f"/>
  <circle cx="${x}" cy="${GROUND - 30 * s}" r="${13 * s}" fill="#27503f"/><circle cx="${x - 7 * s}" cy="${GROUND - 24 * s}" r="${9 * s}" fill="#2f5f4a"/><circle cx="${x + 7 * s}" cy="${GROUND - 25 * s}" r="${9 * s}" fill="#356b53"/></g>`;

const lamp = (x) => `<g class="hc-lamp"><rect x="${x}" y="${GROUND - 44}" width="1.6" height="44" fill="#6f7782"/><path d="M${x + 1} ${GROUND - 44}h11" stroke="#6f7782" stroke-width="1.5"/>
  <circle class="hc-lamp-glow" cx="${x + 12}" cy="${GROUND - 42}" r="22" fill="url(#hc-lamp)"/><circle cx="${x + 12}" cy="${GROUND - 43}" r="1.8" fill="#ffe7c4"/></g>`;

function nearLayer(r, lit) {
  const window2 = (x, y, w, h, on) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${on ? '#ffd9a4' : '#2d3a4d'}"/><path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="#20262f" stroke-width="0.8"/>`;
  const gable = building('gable', 1.15,
    `M676 ${GROUND}V${GROUND - 36}L714 ${GROUND - 66}L752 ${GROUND - 36}V${GROUND}`,
    `${rect(680, GROUND - 38, 68, 38, '#d8d1c3')}<path d="M672 ${GROUND - 36}L714 ${GROUND - 70}L756 ${GROUND - 36}z" fill="url(#hc-tile)"/>${rect(732, GROUND - 66, 8, 20, '#8a4e36')}
     ${window2(688, GROUND - 28, 14, 13, r() < lit + 0.3)}${window2(726, GROUND - 28, 14, 13, r() < lit + 0.3)}${rect(708, GROUND - 24, 12, 24, '#6b4a2f')}<circle cx="717" cy="${GROUND - 12}" r="0.9" fill="#e7d7bd"/>`);
  const smoke = `<g class="hc-smoke">${[0, 1, 2].map((i) => `<circle cx="736" cy="${GROUND - 70}" r="${3 + i}" style="animation-delay:${i * 1.6}s"/>`).join('')}</g>`;
  const hip = building('hip', 1.3,
    `M856 ${GROUND}V${GROUND - 32}L874 ${GROUND - 56}H918L936 ${GROUND - 32}V${GROUND}`,
    `${rect(860, GROUND - 34, 72, 34, '#c9c1b2')}<path d="M852 ${GROUND - 32}L874 ${GROUND - 58}H918L940 ${GROUND - 32}z" fill="url(#hc-tile2)"/>
     ${window2(866, GROUND - 25, 13, 12, r() < lit + 0.3)}${rect(888, GROUND - 25, 38, 25, '#3b4552')}<path d="M888 ${GROUND - 17}h38M888 ${GROUND - 9}h38" stroke="#262e38" stroke-width="0.9"/>`);
  const modern = building('modern', 1.45,
    `M996 ${GROUND}V${GROUND - 26}H1036V${GROUND - 54}H1098V${GROUND}`,
    `${rect(996, GROUND - 26, 104, 26, '#e6e2d8')}${rect(1036, GROUND - 54, 62, 28, '#3a3f47')}${rect(1030, GROUND - 57, 74, 3, '#e6e2d8')}
     <rect x="1042" y="${GROUND - 50}" width="50" height="20" fill="${r() < lit + 0.4 ? '#ffd9a4' : 'url(#hc-glass)'}"/><path d="M1058 ${GROUND - 50}v20M1075 ${GROUND - 50}v20" stroke="#20262f"/>
     <rect x="1004" y="${GROUND - 20}" width="84" height="20" fill="url(#hc-glass)"/><path d="M1032 ${GROUND - 20}v20M1060 ${GROUND - 20}v20" stroke="#20262f"/>`);
  return `<g class="hc-layer hc-near" data-depth="20">${smoke}${gable}${hip}${modern}
    ${tree(772, 1, 1)}${tree(792, 0.75, 3)}${tree(958, 1.05, 2)}${tree(1120, 0.95, 4)}${tree(1150, 0.7, 1.5)}${tree(620, 1, 2.5)}${tree(420, 0.9, 0.5)}
    ${lamp(642)}${lamp(838)}${lamp(980)}${lamp(1176)}</g>`;
}

const car = (cls, body, roof, y) => `<g class="hc-car ${cls}"><g transform="translate(0 ${y})">
  <path d="M0 0h6l8-8h24l9 8h9q4 0 4 4v3h-60z" fill="${body}"/><path d="M15-7h9v7h-15zM26-7h10l7 7h-17z" fill="${roof}"/>
  <circle cx="13" cy="7" r="3.6" fill="#14161b"/><circle cx="47" cy="7" r="3.6" fill="#14161b"/><path class="hc-beam" d="M60 3l58-9v20z" fill="url(#hc-beam)"/><circle cx="59" cy="3" r="1.4" fill="#fff2d6"/></g></g>`;

function street() {
  let dashes = '';
  for (let x = 0; x < 1200; x += 34) dashes += `<rect x="${x}" y="307" width="16" height="1.4"/>`;
  return `<g class="hc-layer hc-street" data-depth="26"><rect x="0" y="${GROUND}" width="1200" height="4" fill="#3b4048"/><rect x="0" y="296" width="1200" height="28" fill="url(#hc-road)"/><g class="hc-dash">${dashes}</g>
    ${car('a', '#b9412f', '#1f2732', 296)}${car('b', '#d7d9dd', '#1f2732', 296)}${car('c', '#2d4f76', '#141b24', 310)}</g>`;
}

function skyLayer(r, mode) {
  let stars = '';
  if (mode === 'night') for (let i = 0; i < 46; i++) stars += `<circle cx="${(r() * 1200).toFixed(0)}" cy="${(r() * 170).toFixed(0)}" r="${(0.5 + r() * 0.9).toFixed(1)}"${r() < 0.2 ? ` class="tw" style="animation-delay:-${(r() * 5).toFixed(1)}s"` : ''}/>`;
  const cloud = (x, y, s, cls) => `<g class="hc-cloud ${cls}" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="74" ry="11" fill="url(#hc-cloud)"/><ellipse cx="-18" cy="-8" rx="38" ry="11" fill="url(#hc-cloud)"/><ellipse cx="22" cy="-6" rx="30" ry="9" fill="url(#hc-cloud)"/></g>`;
  const birds = '<g class="hc-birds"><path d="M0 0q5-5 10 0q5-5 10 0M26-10q4-4 8 0q4-4 8 0M-22-12q4-4 8 0q4-4 8 0"/></g>';
  return `<rect width="1200" height="320" fill="url(#hc-sky)"/><g class="hc-stars">${stars}</g>
    <g class="hc-layer" data-depth="2"><g class="hc-sun"><circle cx="985" cy="150" r="150" fill="url(#hc-halo)"/><circle cx="985" cy="150" r="38" fill="url(#hc-disc)"/></g>
    ${cloud(1040, 62, 1, 'c1')}${cloud(720, 100, 0.72, 'c2')}${cloud(380, 48, 0.85, 'c3')}${birds}</g>`;
}

const DEFS = `<defs>
  <linearGradient id="hc-sky" x1="0" y1="0" x2="0" y2="1"><stop class="hc-s1" offset="0"/><stop class="hc-s2" offset="0.62"/><stop class="hc-s3" offset="1"/></linearGradient>
  <radialGradient id="hc-halo"><stop class="hc-h1" offset="0"/><stop class="hc-h2" offset="1"/></radialGradient>
  <radialGradient id="hc-disc"><stop offset="0" stop-color="#fff3df"/><stop class="hc-d2" offset="1"/></radialGradient>
  <linearGradient id="hc-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3c4f68"/><stop offset="1" stop-color="#1b2431"/></linearGradient>
  <linearGradient id="hc-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b4a55"/><stop offset="1" stop-color="#20212a"/></linearGradient>
  <linearGradient id="hc-c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d675e"/><stop offset="1" stop-color="#37342f"/></linearGradient>
  <linearGradient id="hc-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb2cf"/><stop offset="1" stop-color="#2e4358"/></linearGradient>
  <linearGradient id="hc-dome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3b37b"/><stop offset="1" stop-color="#7c5a35"/></linearGradient>
  <linearGradient id="hc-tile" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b65a3b"/><stop offset="1" stop-color="#7b3522"/></linearGradient>
  <linearGradient id="hc-tile2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b7480"/><stop offset="1" stop-color="#3a414b"/></linearGradient>
  <linearGradient id="hc-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23262c"/><stop offset="1" stop-color="#14161a"/></linearGradient>
  <linearGradient id="hc-glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="hc-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffeec9" stop-opacity="0.55"/><stop offset="1" stop-color="#ffeec9" stop-opacity="0"/></linearGradient>
  <radialGradient id="hc-lamp"><stop offset="0" stop-color="#ffdca6" stop-opacity="0.75"/><stop offset="1" stop-color="#ffdca6" stop-opacity="0"/></radialGradient>
  <radialGradient id="hc-cloud"><stop offset="0" class="hc-c1"/><stop offset="1" class="hc-c2"/></radialGradient>
  <clipPath id="hc-clip-tower"><rect x="804" y="60" width="88" height="232"/></clipPath>
  <clipPath id="hc-clip-chamfer"><path d="M898 292V122L966 86V292z"/></clipPath>
</defs>`;

/** Marcado de la escena; `.hc` lleva la hora del día para el color del cielo y las luces. */
export function cityScene() {
  const mode = sky();
  const r = rng(20261109);
  const lit = mode === 'night' ? 0.72 : mode === 'dusk' ? 0.5 : 0.2;
  return `<div class="hc" data-sky="${mode}" aria-hidden="true"><svg viewBox="0 0 1200 324" preserveAspectRatio="xMaxYMax slice">
    ${DEFS}${skyLayer(r, mode)}${farLayer(r)}${midLayer(r, lit)}${nearLayer(r, lit)}${street()}</svg></div>`;
}

/** Profundidad al mover el cursor y pausa cuando la escena no se ve. Devuelve la limpieza. */
export function startCity(hero) {
  const scene = hero?.querySelector('.hc');
  if (!scene) return () => {};
  const visible = new IntersectionObserver(([e]) => scene.classList.toggle('paused', !e.isIntersecting));
  visible.observe(scene);
  const onVisibility = () => scene.classList.toggle('hidden-tab', document.hidden);
  document.addEventListener('visibilitychange', onVisibility);
  let stopParallax = () => {};
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const layers = [...scene.querySelectorAll('.hc-layer')].map((node) => ({ node, depth: Number(node.dataset.depth) }));
    let target = 0; let tiltY = 0; let x = 0; let y = 0; let raf = 0;
    const step = () => {
      x += (target - x) * 0.08;
      y += (tiltY - y) * 0.08;
      layers.forEach(({ node, depth }) => node.setAttribute('transform', `translate(${(x * depth).toFixed(2)} ${(y * depth * 0.25).toFixed(2)})`));
      raf = Math.abs(target - x) + Math.abs(tiltY - y) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    const move = (e) => {
      const b = hero.getBoundingClientRect();
      target = 0.5 - (e.clientX - b.left) / b.width;
      tiltY = 0.5 - (e.clientY - b.top) / b.height;
      kick();
    };
    const out = () => { target = 0; tiltY = 0; kick(); };
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', out);
    stopParallax = () => { cancelAnimationFrame(raf); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', out); };
  }
  return () => { visible.disconnect(); document.removeEventListener('visibilitychange', onVisibility); stopParallax(); };
}
