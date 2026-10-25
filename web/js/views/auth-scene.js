// Escena del acceso: un distrito urbano isométrico vivo, con ciclo de día y noche (28 s).
//   · Torre principal de vidrio que sube piso a piso, con reflejo que la recorre.
//   · Torre en construcción: estructura de acero, losas y grúa que gira con su carga.
//   · Edificio circular con cúpula, edificio bajo con techo verde y paneles solares.
//   · Calles con carriles, autos que circulan, postes de luz que se encienden de noche.
//   · Árboles que se mecen, nubes, un dron de topografía que escanea el lote.
//   · Cotas, etiquetas de plano, rosa de los vientos y escala gráfica.
// Todo es SVG y CSS (sin scripts en tiempo de ejecución) y respeta «reducir movimiento».

const S = 15.5;
const CX = 300;
const CY = 352;
const P = (x, y, z = 0) => [CX + (x - y) * 0.866 * S, CY + (x + y) * 0.5 * S - z * S];
const f = (n) => n.toFixed(1);
const pts = (...a) => a.map((p) => `${f(p[0])},${f(p[1])}`).join(' ');
const CYCLE = 14;

/** Prisma isométrico: caras visibles (izquierda, derecha y techo). */
function box(x0, x1, y0, y1, z0, z1, cls = '', roof = true) {
  const l = `<polygon class="fl ${cls}" points="${pts(P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1))}"/>`;
  const r = `<polygon class="fr ${cls}" points="${pts(P(x1, y1, z0), P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1))}"/>`;
  const t = roof ? `<polygon class="ft ${cls}" points="${pts(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1))}"/>` : '';
  return l + r + t;
}

/** Ventanas sobre las dos caras visibles de un prisma (se encienden en momentos distintos). */
function windows(x0, x1, y0, y1, z0, z1, { cols = 3, rows = 4, seed = 1 } = {}) {
  let out = '';
  const fh = (z1 - z0) / rows;
  let k = seed;
  const next = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
  for (let r = 0; r < rows; r++) {
    const za = z0 + r * fh + fh * 0.25;
    const zb = za + fh * 0.5;
    for (let c = 0; c < cols; c++) {
      const a = x0 + (x1 - x0) * (c + 0.25) / cols;
      const b = a + (x1 - x0) * 0.5 / cols;
      out += `<polygon class="win" style="animation-delay:${(next() * 9).toFixed(2)}s" points="${pts(P(a, y1, za), P(b, y1, za), P(b, y1, zb), P(a, y1, zb))}"/>`;
      const c0 = y1 - (y1 - y0) * (c + 0.25) / cols;
      const c1 = c0 - (y1 - y0) * 0.5 / cols;
      out += `<polygon class="win r" style="animation-delay:${(next() * 9).toFixed(2)}s" points="${pts(P(x1, c0, za), P(x1, c1, za), P(x1, c1, zb), P(x1, c0, zb))}"/>`;
    }
  }
  return out;
}

function tree(x, y, size = 1, delay = 0) {
  const [gx, gy] = P(x, y, 0);
  const [tx, ty] = P(x, y, 0.9 * size);
  return `<g class="tree" style="--sw:${delay}s">
    <ellipse class="tree-shadow" cx="${f(gx + 6)}" cy="${f(gy + 2)}" rx="${f(9 * size)}" ry="${f(3.5 * size)}"/>
    <line class="trunk" x1="${f(gx)}" y1="${f(gy)}" x2="${f(tx)}" y2="${f(ty)}"/>
    <g class="crown" style="transform-origin:${f(gx)}px ${f(gy)}px"><circle cx="${f(tx)}" cy="${f(ty - 3 * size)}" r="${f(7.5 * size)}"/><circle class="hl" cx="${f(tx - 2.5 * size)}" cy="${f(ty - 5.5 * size)}" r="${f(3 * size)}"/></g>
  </g>`;
}

function lamp(x, y, delay = 0) {
  const [gx, gy] = P(x, y, 0);
  const [tx, ty] = P(x, y, 1.3);
  return `<g class="lamp"><line x1="${f(gx)}" y1="${f(gy)}" x2="${f(tx)}" y2="${f(ty)}"/>
    <circle class="lamp-glow" cx="${f(tx)}" cy="${f(ty)}" r="9" style="animation-delay:${delay}s"/><circle class="lamp-bulb" cx="${f(tx)}" cy="${f(ty)}" r="1.8"/>
    <ellipse class="lamp-pool" cx="${f(gx)}" cy="${f(gy)}" rx="14" ry="5" style="animation-delay:${delay}s"/></g>`;
}

/** Auto isométrico que recorre una calle (SMIL animateMotion, sin scripts). */
function car(from, to, dur, begin, color, alongX) {
  const [ax, ay] = P(...from);
  const [bx, by] = P(...to);
  const L = alongX ? [0.55, 0.28] : [0.28, 0.55];
  const body = box(-L[0], L[0], -L[1], L[1], 0, 0.32, 'car', true)
    .replaceAll(/points="([^"]+)"/g, (m, p) => `points="${p.split(' ').map((q) => { const [x, y] = q.split(',').map(Number); return `${f(x - CX)},${f(y - CY)}`; }).join(' ')}"`);
  return `<g class="car" style="--car:${color}">${body}
    <circle class="car-light" r="1.6" cx="${alongX ? 7 : -7}" cy="2"/>
    <animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="M${f(ax)} ${f(ay)} L${f(bx)} ${f(by)}"/></g>`;
}

export function districtScene() {
  // ---------------- terreno: placa del distrito con bordes y calles en cruz
  const plate = `<g class="plate">
    <polygon class="pl-top" points="${pts(P(-8, -8), P(8, -8), P(8, 8), P(-8, 8))}"/>
    <polygon class="pl-l" points="${pts(P(-8, 8), P(8, 8), P(8, 8, -0.6), P(-8, 8, -0.6))}"/>
    <polygon class="pl-r" points="${pts(P(8, 8), P(8, -8), P(8, -8, -0.6), P(8, 8, -0.6))}"/>
    <polygon class="street" points="${pts(P(-8, -0.9), P(8, -0.9), P(8, 0.9), P(-8, 0.9))}"/>
    <polygon class="street" points="${pts(P(-0.9, -8), P(0.9, -8), P(0.9, 8), P(-0.9, 8))}"/>
    <line class="lane" x1="${f(P(-8, 0)[0])}" y1="${f(P(-8, 0)[1])}" x2="${f(P(8, 0)[0])}" y2="${f(P(8, 0)[1])}"/>
    <line class="lane" x1="${f(P(0, -8)[0])}" y1="${f(P(0, -8)[1])}" x2="${f(P(0, 8)[0])}" y2="${f(P(0, 8)[1])}"/>
    ${[[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].map(([x, y]) => `<circle class="corner" cx="${f(P(x, y)[0])}" cy="${f(P(x, y)[1])}" r="1.2"/>`).join('')}
    <polyline class="plot" pathLength="1" points="${pts(P(1.6, -7.2), P(7.2, -7.2), P(7.2, -1.6), P(1.6, -1.6), P(1.6, -7.2))}"/>
  </g>`;

  // ---------------- lote NO: torre en construcción (estructura, losas, grúa)
  let frame = '';
  const fz = 0.85;
  const levels = 11;
  for (let i = 0; i <= levels; i++) {
    const z = i * fz;
    frame += `<polyline class="beam" points="${pts(P(-6.5, -3, z), P(-3, -3, z), P(-3, -6.5, z))}"/>`;
    if (i <= 7) frame += `<polygon class="slab" points="${pts(P(-6.5, -6.5, z), P(-3, -6.5, z), P(-3, -3, z), P(-6.5, -3, z))}"/>`;
  }
  for (const [x, y] of [[-6.5, -3], [-4.75, -3], [-3, -3], [-3, -4.75], [-3, -6.5]]) {
    frame += `<line class="col" x1="${f(P(x, y, 0)[0])}" y1="${f(P(x, y, 0)[1])}" x2="${f(P(x, y, levels * fz)[0])}" y2="${f(P(x, y, levels * fz)[1])}"/>`;
  }
  for (let i = 0; i < levels; i++) { // arriostramientos en X
    const z0 = i * fz; const z1 = z0 + fz;
    frame += `<line class="brace" x1="${f(P(-6.5, -3, z0)[0])}" y1="${f(P(-6.5, -3, z0)[1])}" x2="${f(P(-4.75, -3, z1)[0])}" y2="${f(P(-4.75, -3, z1)[1])}"/>`;
    frame += `<line class="brace" x1="${f(P(-3, -4.75, z0)[0])}" y1="${f(P(-3, -4.75, z0)[1])}" x2="${f(P(-3, -6.5, z1)[0])}" y2="${f(P(-3, -6.5, z1)[1])}"/>`;
  }
  const mb = P(-7.3, -7.3, 0); const mt = P(-7.3, -7.3, 12.2);
  const crane = `<g class="crane2">
    <line class="mast" x1="${f(mb[0])}" y1="${f(mb[1])}" x2="${f(mt[0])}" y2="${f(mt[1])}"/>
    ${Array.from({ length: 12 }, (_, k) => { const a = P(-7.3, -7.3, k * 1.016); const b = P(-7.3, -7.3, (k + 1) * 1.016); return `<line class="lat" x1="${f(a[0] - 3)}" y1="${f(a[1])}" x2="${f(b[0] + 3)}" y2="${f(b[1])}"/>`; }).join('')}
    <g class="jib2" style="transform-origin:${f(mt[0])}px ${f(mt[1])}px">
      <line class="mast" x1="${f(mt[0] - 40)}" y1="${f(mt[1])}" x2="${f(mt[0] + 150)}" y2="${f(mt[1])}"/>
      <line class="lat" x1="${f(mt[0])}" y1="${f(mt[1] - 20)}" x2="${f(mt[0] + 150)}" y2="${f(mt[1])}"/>
      <line class="lat" x1="${f(mt[0])}" y1="${f(mt[1] - 20)}" x2="${f(mt[0] - 40)}" y2="${f(mt[1])}"/>
      <rect class="cw" x="${f(mt[0] - 40)}" y="${f(mt[1])}" width="14" height="8"/>
      <g class="hook2"><line class="cable" x1="${f(mt[0] + 104)}" y1="${f(mt[1])}" x2="${f(mt[0] + 104)}" y2="${f(mt[1] + 64)}"/>
        <rect class="load" x="${f(mt[0] + 90)}" y="${f(mt[1] + 64)}" width="28" height="6"/>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 26; 0 26; 0 0; 0 0" keyTimes="0;0.35;0.5;0.85;1" dur="9s" repeatCount="indefinite"/></g>
    </g>
    <circle class="beacon" cx="${f(mt[0])}" cy="${f(mt[1] - 22)}" r="2.2"/>
  </g>`;
  const lotNW = `<g class="lot nw">${box(-7.2, -2.4, -7.2, -2.4, 0, 0.12, 'pad')}${frame}${crane}</g>`;

  // ---------------- lote NE: torre principal de vidrio que sube en bucle
  const floors = 14; const fh = 0.92;
  let tower = '';
  let kf = '';
  for (let i = 0; i < floors; i++) {
    const za = i * fh; const zb = za + fh - 0.12;
    const at = 8 + i * 3.4;
    kf += `@keyframes tf${i}{0%,${f(at - 0.1)}%{opacity:0;transform:translateY(-14px)}${f(at + 3.5)}%,88%{opacity:1;transform:none}96%,100%{opacity:0}}`;
    tower += `<g class="floor" style="animation:tf${i} ${CYCLE}s cubic-bezier(.16,1,.3,1) infinite">${box(2.4, 6.2, -6.2, -2.4, za, zb, 'glass', false)}
      <polyline class="slab-line" points="${pts(P(2.4, -2.4, zb), P(6.2, -2.4, zb), P(6.2, -6.2, zb))}"/>${windows(2.4, 6.2, -6.2, -2.4, za, zb, { cols: 4, rows: 1, seed: i + 3 })}</g>`;
  }
  const H = floors * fh;
  kf += `@keyframes troof{0%,${f(8 + floors * 3.4)}%{opacity:0;transform:translateY(-14px)}${f(12 + floors * 3.4)}%,88%{opacity:1;transform:none}96%,100%{opacity:0}}`;
  const crown = `<g style="animation:troof ${CYCLE}s cubic-bezier(.16,1,.3,1) infinite">${box(2.4, 6.2, -6.2, -2.4, H, H + 0.35, 'roof')}${box(3.6, 5, -5, -3.6, H + 0.35, H + 1.6, 'roof')}
    <line class="mast-thin" x1="${f(P(4.3, -4.3, H + 1.6)[0])}" y1="${f(P(4.3, -4.3, H + 1.6)[1])}" x2="${f(P(4.3, -4.3, H + 4)[0])}" y2="${f(P(4.3, -4.3, H + 4)[1])}"/>
    <circle class="beacon" cx="${f(P(4.3, -4.3, H + 4)[0])}" cy="${f(P(4.3, -4.3, H + 4)[1])}" r="2"/></g>`;
  const sheen = `<polygon class="sheen" points="${pts(P(2.4, -2.4, 0), P(3.4, -2.4, 0), P(3.4, -2.4, H), P(2.4, -2.4, H))}"/>`;
  const lotNE = `<g class="lot ne">${box(1.8, 6.8, -6.8, -1.8, 0, 0.15, 'pad')}<g class="tower">${tower}${crown}</g>${sheen}</g>`;

  // ---------------- lote SO: edificio circular con cúpula y plaza
  const cxy = [-4.4, 4.4]; const rad = 2.4; const ch = 4.2;
  const c0 = P(cxy[0], cxy[1], 0); const c1 = P(cxy[0], cxy[1], ch);
  const rx = rad * 0.866 * S * 1.414; const ry = rx / 2;
  let ribs = '';
  for (let k = -3; k <= 3; k++) ribs += `<line class="rib" x1="${f(c0[0] + (k / 3.4) * rx)}" y1="${f(c0[1] + ry * Math.sqrt(1 - (k / 3.4) ** 2))}" x2="${f(c1[0] + (k / 3.4) * rx)}" y2="${f(c1[1] + ry * Math.sqrt(1 - (k / 3.4) ** 2))}"/>`;
  const rotunda = `<g class="rotunda">
    <path class="cyl" d="M${f(c0[0] - rx)} ${f(c0[1])} A${f(rx)} ${f(ry)} 0 0 0 ${f(c0[0] + rx)} ${f(c0[1])} L${f(c1[0] + rx)} ${f(c1[1])} A${f(rx)} ${f(ry)} 0 0 1 ${f(c1[0] - rx)} ${f(c1[1])} Z"/>
    ${ribs}
    <ellipse class="cyl-top" cx="${f(c1[0])}" cy="${f(c1[1])}" rx="${f(rx)}" ry="${f(ry)}"/>
    <path class="dome" d="M${f(c1[0] - rx * 0.86)} ${f(c1[1])} A${f(rx * 0.86)} ${f(rx * 0.78)} 0 0 1 ${f(c1[0] + rx * 0.86)} ${f(c1[1])} A${f(rx * 0.86)} ${f(ry * 0.86)} 0 0 1 ${f(c1[0] - rx * 0.86)} ${f(c1[1])} Z"/>
    <path class="dome-hl" d="M${f(c1[0] - rx * 0.5)} ${f(c1[1] - rx * 0.45)} Q${f(c1[0] - rx * 0.1)} ${f(c1[1] - rx * 0.78)} ${f(c1[0] + rx * 0.3)} ${f(c1[1] - rx * 0.62)}"/>
  </g>`;
  const lotSW = `<g class="lot sw">${box(-7.2, -1.6, 1.6, 7.2, 0, 0.1, 'plaza')}
    <ellipse class="fountain" cx="${f(P(-2.6, 2.6)[0])}" cy="${f(P(-2.6, 2.6)[1])}" rx="11" ry="5.5"/>
    ${tree(-6.6, 1.9, 0.9, 0.2)}${tree(-2.4, 6.6, 0.95, 1.1)}${rotunda}${tree(-1.9, 4.6, 0.8, 0.6)}${tree(-4.6, 6.9, 0.85, 1.6)}</g>`;

  // ---------------- lote SE: edificio bajo con techo verde y paneles solares
  let solar = '';
  for (let i = 0; i < 3; i++) solar += `<polygon class="solar" points="${pts(P(2.8 + i * 1.1, 2.6, 3.25), P(3.6 + i * 1.1, 2.6, 3.25), P(3.6 + i * 1.1, 3.6, 3.55), P(2.8 + i * 1.1, 3.6, 3.55))}"/>`;
  const lotSE = `<g class="lot se">${box(1.6, 7.2, 1.6, 7.2, 0, 0.1, 'pad')}
    ${box(2.2, 6.6, 2.2, 5.4, 0, 3.1, 'low')}${windows(2.2, 6.6, 2.2, 5.4, 0, 3.1, { cols: 4, rows: 3, seed: 21 })}
    <polygon class="green" points="${pts(P(2.5, 4, 3.1), P(6.3, 4, 3.1), P(6.3, 5.1, 3.1), P(2.5, 5.1, 3.1))}"/>${solar}
    ${tree(6.6, 6.4, 0.9, 0.4)}${tree(3.2, 6.6, 0.8, 1.3)}${tree(1.9, 6.1, 0.7, 0.9)}</g>`;

  // ---------------- tráfico y alumbrado
  const cars = car([-8, -0.45, 0], [8, -0.45, 0], 7, 0, '#d6a46c', true) + car([8, 0.45, 0], [-8, 0.45, 0], 8.5, 2, '#9fb2d3', true)
    + car([0.45, -8, 0], [0.45, 8, 0], 9, 1, '#e9e6df', false) + car([-0.45, 8, 0], [-0.45, -8, 0], 7.5, 4, '#e57a6e', false);
  const lamps = [[-1.3, -4], [1.3, 4], [-4, 1.3], [4, -1.3], [-1.3, 6.5], [6.5, 1.3]].map(([x, y], i) => lamp(x, y, i * 0.4)).join('');

  // ---------------- cielo: nubes, dron de topografía
  const clouds = `<g class="clouds"><g class="cloud c1"><ellipse cx="0" cy="0" rx="34" ry="9"/><ellipse cx="18" cy="-6" rx="20" ry="9"/><ellipse cx="-16" cy="-4" rx="16" ry="7"/></g>
    <g class="cloud c2"><ellipse cx="0" cy="0" rx="26" ry="7"/><ellipse cx="12" cy="-5" rx="14" ry="7"/></g></g>`;
  const dronePath = `M${f(P(-2, 4, 12)[0])} ${f(P(-2, 4, 12)[1])} C${f(P(6, 6, 13)[0])} ${f(P(6, 6, 13)[1])} ${f(P(8, -4, 13)[0])} ${f(P(8, -4, 13)[1])} ${f(P(4, -6, 12)[0])} ${f(P(4, -6, 12)[1])} S${f(P(-6, -2, 12)[0])} ${f(P(-6, -2, 12)[1])} ${f(P(-2, 4, 12)[0])} ${f(P(-2, 4, 12)[1])}`;
  const drone = `<g class="drone"><polygon class="scan" points="0,4 -26,74 26,74"/>
    <line class="arm" x1="-9" y1="-1" x2="9" y2="1"/><line class="arm" x1="-7" y1="2" x2="7" y2="-2"/>
    <rect class="body" x="-3.5" y="-2.5" width="7" height="5" rx="1.5"/><circle class="led" cx="0" cy="3" r="1.3"/>
    ${[[-9, -1], [9, 1], [-7, 2], [7, -2]].map(([x, y]) => `<ellipse class="rotor" cx="${x}" cy="${y - 2}" rx="4.5" ry="1.2"/>`).join('')}
    <animateMotion dur="16s" repeatCount="indefinite" path="${dronePath}"/></g>`;

  // ---------------- planos: cotas, etiquetas, norte y escala
  const d0 = P(6.9, -1.9, 0); const d1 = P(6.9, -1.9, H + 0.35);
  const tag = (x, y, text, delay, cls = '') => `<g class="tag ${cls}" style="animation-delay:${delay}s"><rect x="${f(x)}" y="${f(y - 13)}" width="${f(text.length * 5.9 + 16)}" height="19" rx="6"/><text x="${f(x + 8)}" y="${f(y)}">${text}</text></g>`;
  const notes = `<g class="dim2"><line pathLength="1" x1="${f(d0[0] + 14)}" y1="${f(d0[1] + 7)}" x2="${f(d1[0] + 14)}" y2="${f(d1[1] + 7)}"/>
      <line x1="${f(d0[0] + 8)}" y1="${f(d0[1] + 7)}" x2="${f(d0[0] + 20)}" y2="${f(d0[1] + 7)}"/><line x1="${f(d1[0] + 8)}" y1="${f(d1[1] + 7)}" x2="${f(d1[0] + 20)}" y2="${f(d1[1] + 7)}"/></g>
    ${tag(d1[0] + 22, (d0[1] + d1[1]) / 2 + 7, '14 PISOS · 41,2 m', 6.5)}
    ${tag(P(-3, -6.5, levels * fz)[0] - 120, P(-3, -6.5, levels * fz)[1] - 18, 'OBRA · ESTRUCTURA N11', 2.5, 'steel')}
    ${tag(P(-1.6, 7.2)[0] - 150, P(-1.6, 7.2)[1] + 18, 'ROTONDA · Ø 4,8 m', 9.5)}
    <g class="compass" transform="translate(560 40)"><circle r="17"/><path class="n" d="M0 -14 L5 4 L0 1 L-5 4 Z"/><text y="-21" text-anchor="middle">N</text></g>
    <g class="scalebar" transform="translate(470 560)"><rect x="0" y="0" width="20" height="4"/><rect class="w" x="20" y="0" width="20" height="4"/><rect x="40" y="0" width="20" height="4"/><rect class="w" x="60" y="0" width="20" height="4"/><text x="0" y="16">0</text><text x="72" y="16">20 m</text></g>`;

  return `<svg class="auth-scene district" viewBox="0 0 600 600" aria-hidden="true">
    <defs>
      <style>${kf}</style>
      <radialGradient id="ds-sun"><stop offset="0" stop-color="#ffe2bb"/><stop offset=".4" stop-color="#d6a46c" stop-opacity=".5"/><stop offset="1" stop-color="#d6a46c" stop-opacity="0"/></radialGradient>
      <linearGradient id="ds-glass-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8d4ea" stop-opacity=".55"/><stop offset="1" stop-color="#5b75a6" stop-opacity=".32"/></linearGradient>
      <linearGradient id="ds-glass-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d90b4" stop-opacity=".55"/><stop offset="1" stop-color="#26324c" stop-opacity=".5"/></linearGradient>
      <linearGradient id="ds-cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a4865"/><stop offset=".45" stop-color="#9fb2d3" stop-opacity=".75"/><stop offset="1" stop-color="#222c41"/></linearGradient>
      <radialGradient id="ds-dome" cx=".35" cy=".3"><stop offset="0" stop-color="#fff2dc"/><stop offset=".5" stop-color="#d6a46c" stop-opacity=".75"/><stop offset="1" stop-color="#6e4b26" stop-opacity=".8"/></radialGradient>
      <linearGradient id="ds-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="ds-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb2d3" stop-opacity=".45"/><stop offset="1" stop-color="#9fb2d3" stop-opacity="0"/></linearGradient>
    </defs>
    <g class="sky-sun"><circle cx="505" cy="92" r="70" fill="url(#ds-sun)"/><circle class="sun-core" cx="505" cy="92" r="15"/></g>
    <g class="sky-moon"><circle cx="96" cy="86" r="12"/><circle class="moon-cut" cx="102" cy="82" r="11"/></g>
    ${clouds}
    ${plate}
    ${lotNW}
    ${lotNE}
    ${cars}
    ${lotSW}
    ${lotSE}
    ${lamps}
    ${drone}
    ${notes}
  </svg>`;
}
