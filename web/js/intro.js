// Intro de bienvenida tras iniciar sesión, en el mismo entorno que la pantalla de acceso: la ciudad a
// la hora dorada. El cielo pasa de azul profundo a ámbar con el sol bajo, el perfil de la ciudad
// enciende sus ventanas, una torre contemporánea en axonometría se traza en líneas doradas como un
// plano, se materializa en vidrio con un barrido de luz y la bienvenida aparece abajo a la izquierda
// mientras la aplicación carga detrás. Se salta con un clic, Esc o Enter, y se puede desactivar en
// Perfil › Preferencias. Con «reducir movimiento» se muestra completa y quieta un instante.

const KEY = 'civia-intro';

export function introEnabled() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setIntroEnabled(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* modo privado */ }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Proyección axonométrica (isométrica): x hacia la derecha-abajo, z hacia la izquierda-abajo, y arriba.
const S = 7.2; const CX = 450; const CY = 440;
const COS = Math.cos(Math.PI / 6); const SIN = Math.sin(Math.PI / 6);
const P = (x, y, z) => [CX + (x - z) * COS * S, CY - y * S + (x + z) * SIN * S];
const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const poly = (...ps) => ps.map(pt).join(' ');
const line = (a, b, cls, delay, extra = '') => `<line class="${cls}" pathLength="1" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" style="--d:${delay}s"${extra}/>`;

/** Volumen prismático: caras visibles, aristas para trazar, franjas de losa y ventanas por piso. */
function volume({ x0, x1, z0, z1, y0, y1, floors, bays, id, t0 }) {
  const top = [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)];
  const left = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)]; // cara z = z1
  const right = [P(x1, y0, z1), P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1)]; // cara x = x1
  let out = `<g class="vol">
    <polygon class="face face-l" points="${poly(...left)}" fill="url(#gl-l)"/>
    <polygon class="face face-r" points="${poly(...right)}" fill="url(#gl-r)"/>
    <polygon class="face face-t" points="${poly(...top)}" fill="url(#gl-t)"/>`;
  // Ventanas: rectángulos proyectados por piso y crujía en las dos caras visibles.
  const fh = (y1 - y0) / floors;
  let k = 0;
  for (let f = 0; f < floors; f++) {
    const ya = y0 + f * fh + fh * 0.22; const yb = y0 + (f + 1) * fh - fh * 0.12;
    const delay = (t0 + 1.25 + f * 0.055).toFixed(3);
    for (let b = 0; b < bays; b++) {
      const lit = (f * 7 + b * 3 + id) % 9 < 2;
      const xa = x0 + ((x1 - x0) / bays) * (b + 0.14); const xb = x0 + ((x1 - x0) / bays) * (b + 0.86);
      out += `<polygon class="win${lit ? ' lit' : ''}" points="${poly(P(xa, ya, z1), P(xb, ya, z1), P(xb, yb, z1), P(xa, yb, z1))}" style="--d:${delay}s"/>`;
      const za = z1 - ((z1 - z0) / bays) * (b + 0.14); const zb = z1 - ((z1 - z0) / bays) * (b + 0.86);
      const lit2 = (f * 5 + b * 11 + id) % 11 < 2;
      out += `<polygon class="win side${lit2 ? ' lit' : ''}" points="${poly(P(x1, ya, za), P(x1, ya, zb), P(x1, yb, zb), P(x1, yb, za))}" style="--d:${delay}s"/>`;
      k++;
    }
  }
  // Franjas de losa en cada piso.
  for (let f = 1; f < floors; f++) {
    const y = y0 + f * fh;
    out += `<polyline class="slab" points="${poly(P(x0, y, z1), P(x1, y, z1), P(x1, y, z0))}" style="--d:${(t0 + 0.9 + f * 0.03).toFixed(3)}s"/>`;
  }
  // Aristas que se trazan como en el plano.
  const edges = [
    [P(x0, y0, z1), P(x1, y0, z1)], [P(x1, y0, z1), P(x1, y0, z0)],
    [P(x0, y0, z1), P(x0, y1, z1)], [P(x1, y0, z1), P(x1, y1, z1)], [P(x1, y0, z0), P(x1, y1, z0)],
    [P(x0, y1, z1), P(x1, y1, z1)], [P(x1, y1, z1), P(x1, y1, z0)], [P(x1, y1, z0), P(x0, y1, z0)], [P(x0, y1, z0), P(x0, y1, z1)],
  ];
  edges.forEach(([a, b], i) => { out += line(a, b, 'edge', (t0 + i * 0.07).toFixed(2)); });
  return `${out}</g>`;
}

function svg() {
  const podium = volume({ x0: -14, x1: 10, z0: -10, z1: 12, y0: 0, y1: 7, floors: 2, bays: 6, id: 1, t0: 0.35 });
  const tower = volume({ x0: -6, x1: 6, z0: -4, z1: 8, y0: 7, y1: 52, floors: 14, bays: 4, id: 3, t0: 0.6 });
  const wing = volume({ x0: 13, x1: 22, z0: -8, z1: 4, y0: 0, y1: 22, floors: 6, bays: 3, id: 5, t0: 0.5 });
  // Cotas: altura total junto a la torre y planta del basamento.
  // Cota vertical a la izquierda de la torre (lado libre), con remates y rótulo alineado a la derecha.
  const hA = P(-6, 0, 8); const hB = P(-6, 52, 8);
  const dx = -64;
  const xA = hA[0] + dx; const xB = hB[0] + dx;
  const dim = `<g class="dims">
    ${line([xA, hA[1]], [xB, hB[1]], 'dim', 1.6)}
    ${line([xA - 5, hA[1]], [xA + 5, hA[1]], 'dim', 1.7)}
    ${line([xB - 5, hB[1]], [xB + 5, hB[1]], 'dim', 1.7)}
    <text class="note" x="${(xB - 12).toFixed(0)}" y="${(hB[1] + 4).toFixed(0)}" text-anchor="end" style="--d:2s">N +52,00</text>
    <text class="note" x="${(xB - 12).toFixed(0)}" y="${((hA[1] + hB[1]) / 2).toFixed(0)}" text-anchor="end" style="--d:2.1s">16 NIVELES</text>
    <text class="note" x="${(xA - 12).toFixed(0)}" y="${(hA[1] + 4).toFixed(0)}" text-anchor="end" style="--d:2.15s">± 0,00</text>
    ${line(P(-14, 0, 15), P(10, 0, 15), 'dim', 1.8)}
    <text class="note" x="${P(-2, 0, 17)[0].toFixed(0)}" y="${(P(-2, 0, 17)[1] + 16).toFixed(0)}" text-anchor="middle" style="--d:2.2s">24,00 m</text>
  </g>`;
  return `<svg class="intro-art" viewBox="0 0 900 600" role="img" aria-label="Una torre de vidrio se dibuja en planos, se materializa y enciende sus ventanas piso a piso">
    <defs>
      <linearGradient id="gl-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a55"/><stop offset=".55" stop-color="#1a2335"/><stop offset="1" stop-color="#3a2f2a"/></linearGradient>
      <linearGradient id="gl-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46597a"/><stop offset=".6" stop-color="#28344b"/><stop offset="1" stop-color="#5a4433"/></linearGradient>
      <linearGradient id="gl-t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5e6f8c"/><stop offset="1" stop-color="#2c3850"/></linearGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#ffe9cc" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d6a46c" stop-opacity=".35"/><stop offset="1" stop-color="#d6a46c" stop-opacity="0"/></radialGradient>
      <clipPath id="bldg"><polygon points="${poly(P(-14, 0, 12), P(10, 0, 12), P(10, 0, -10), P(10, 7, -10), P(6, 7, -4), P(6, 52, -4), P(-6, 52, -4), P(-6, 52, 8), P(-6, 7, 8), P(-14, 7, 12))}"/><polygon points="${poly(P(13, 0, 4), P(22, 0, 4), P(22, 0, -8), P(22, 22, -8), P(13, 22, -8), P(13, 22, 4))}"/></clipPath>
    </defs>
    <ellipse class="pool" cx="${P(0, 0, 4)[0].toFixed(0)}" cy="${(P(0, 0, 4)[1] + 10).toFixed(0)}" rx="330" ry="70" fill="url(#pool)"/>
    ${line(P(-38, 0, 12), P(30, 0, 12), 'ground', 0.15)}
    ${line(P(10, 0, -40), P(10, 0, 30), 'ground', 0.25)}
    ${wing}${podium}${tower}
    <g clip-path="url(#bldg)"><rect class="sweep" x="-260" y="0" width="220" height="600" fill="url(#sheen)" transform="skewX(-18)"/></g>
    ${dim}
  </svg>`;
}

/** Generador pseudoaleatorio con semilla: el perfil de la ciudad es siempre el mismo. */
function seeded(seed) {
  let t = seed >>> 0;
  return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}

/**
 * Perfil de la ciudad al atardecer en dos planos: el lejano, en la bruma cálida, y el cercano, en
 * contraluz, con ventanas que se encienden una a una.
 */
function skyline() {
  const r = seeded(2026);
  const W = 1600; const H = 420; const G = 404;
  let far = ''; let near = ''; let wins = '';
  for (let x = -20; x < W; x += 34 + r() * 46) {
    const w = 40 + r() * 60; const h = 70 + r() * 150 + (r() < 0.15 ? 90 : 0);
    far += `<rect x="${x.toFixed(0)}" y="${(G - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`;
  }
  for (let x = -30; x < W; x += 46 + r() * 50) {
    // El centro queda más bajo: ahí se levanta la torre de la intro.
    const mid = Math.abs(x + 40 - W / 2) < 260;
    const w = 44 + r() * 64; const h = mid ? 40 + r() * 60 : 70 + r() * 170 + (r() < 0.18 ? 80 : 0);
    const y = G - h;
    near += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`;
    for (let wy = y + 10; wy < G - 12; wy += 14) {
      for (let wx = x + 7; wx < x + w - 9; wx += 11) {
        if (r() < 0.24) wins += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="5" height="7" style="--d:${(0.9 + r() * 2.6).toFixed(2)}s"/>`;
      }
    }
  }
  return `<svg class="ix-city" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="ix-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1b2c"/><stop offset="1" stop-color="#07080e"/></linearGradient></defs>
    <g class="ix-far">${far}</g><g class="ix-near" fill="url(#ix-near)">${near}</g><g class="ix-win">${wins}</g>
    <rect class="ix-ground" x="0" y="${G}" width="${W}" height="${H - G}"/>
  </svg>`;
}

/** Polvo dorado flotando en la luz del atardecer (decoración, se detiene con «reducir movimiento»). */
function motes() {
  const r = seeded(7);
  return Array.from({ length: 18 }, () => `<i style="left:${(r() * 100).toFixed(1)}%;top:${(30 + r() * 55).toFixed(1)}%;--s:${(1 + r() * 2.2).toFixed(1)}px;--t:${(7 + r() * 7).toFixed(1)}s;--d:${(-r() * 8).toFixed(1)}s"></i>`).join('');
}

/**
 * Muestra la intro sobre la aplicación y se resuelve al terminar (o al saltarla).
 * La aplicación sigue cargando detrás, así que al cerrar ya está lista.
 */
export function playIntro(user) {
  if (!introEnabled()) return Promise.resolve();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const first = (user?.fullName || '').trim().split(/\s+/)[0];
  const word = (text, from) => [...text].map((ch, i) => (ch === ' '
    ? '<span class="sp"> </span>'
    : `<span class="lt" style="--i:${from + i}"><span>${esc(ch)}</span></span>`)).join('');
  const hello = first ? `Hola, ${first}.` : 'Hola.';
  const steps = [
    ['projects', 'Proyectos sincronizados'],
    ['cube', 'Modelos listos sin conexión'],
    ['book', 'Biblioteca actualizada'],
    ['sparkle', 'Copilot conectado'],
  ];
  const ICON = {
    projects: '<path d="M3 7h7l2 2h9v11H3z"/><path d="M3 7V4h6l2 3"/>',
    cube: '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  };
  const svgIcon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  const el = document.createElement('div');
  el.className = 'intro lux';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Bienvenida a CIVIA AI');
  el.innerHTML = `
    <div class="ix-sky" aria-hidden="true"><i class="ix-sun"></i><i class="ix-rays"></i></div>
    <div class="ix-stars" aria-hidden="true"></div>
    <div class="ix-motes" aria-hidden="true">${motes()}</div>
    ${skyline()}
    <div class="intro-stage" aria-hidden="true">${svg()}</div>
    <div class="ix-shade" aria-hidden="true"></div>
    <header class="ix-top">
      <div class="ix-brand"><img src="/assets/mark-96.png?v=2" alt="" width="40" height="40"><span>Civia <b>AI</b></span></div>
      <button type="button" class="ix-skip" data-intro-close><span>Saltar</span><kbd>Esc</kbd></button>
    </header>
    <div class="ix-copy">
      <div class="ix-eyebrow"><span>Bienvenido(a) a tu estudio</span><i></i></div>
      <h2 class="ix-title"><span class="ix-line">${word(hello, 0)}</span><span class="ix-line">${word('Tu estudio ', 12)}<span class="ix-gold">${word('está listo.', 23)}</span></span></h2>
      <p class="ix-sub">Del primer trazo a la obra: preparamos tus proyectos, planos y modelos mientras entras.</p>
      <ul class="ix-steps">${steps.map(([ic, t], i) => `<li style="--n:${i}">${svgIcon(ic)}<span>${t}</span><b class="ix-ok" aria-hidden="true"></b></li>`).join('')}</ul>
    </div>
    <div class="ix-end">
      <div class="ix-progress" aria-hidden="true"><i></i></div>
      <button type="button" class="ix-go" data-intro-close><span>Entrar al estudio</span><i aria-hidden="true">→</i></button>
    </div>`;
  if (reduced) el.classList.add('reduced');
  document.body.appendChild(el);
  document.documentElement.classList.add('intro-open');

  return new Promise((resolve) => {
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      el.classList.add('out');
      document.documentElement.classList.remove('intro-open');
      setTimeout(() => { el.remove(); resolve(); }, reduced ? 0 : 450);
    };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') close(); };
    const timer = setTimeout(close, reduced ? 1400 : 7200);
    document.addEventListener('keydown', onKey);
    el.querySelectorAll('[data-intro-close]').forEach((b) => { b.onclick = close; });
    el.querySelector('.ix-skip').focus({ preventScroll: true });
  });
}
