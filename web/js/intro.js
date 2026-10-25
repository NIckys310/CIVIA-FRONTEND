// Intro de bienvenida tras iniciar sesión: el plano se dibuja, el edificio sube piso a piso y
// aparece la marca mientras la aplicación carga detrás. Se salta con un clic, Esc o Enter, y se
// puede desactivar en Perfil › Preferencias. Con «reducir movimiento» dura un instante.

const KEY = 'civia-intro';

export function introEnabled() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setIntroEnabled(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* modo privado */ }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function svg() {
  const n = 24;
  const top = 92;
  const bottom = 440;
  const h = (bottom - top) / n;
  let floors = '';
  for (let i = 0; i < n; i++) {
    const y = bottom - (i + 1) * h;
    const d = (1.3 + i * 0.055).toFixed(2);
    floors += `<rect class="fl" x="336" y="${(y + 1).toFixed(1)}" width="168" height="${(h - 2).toFixed(1)}" fill="url(#ig${i % 6 === 5 ? 2 : 1})" style="animation-delay:${d}s"/>`
      + `<line class="fl" x1="330" y1="${y.toFixed(1)}" x2="510" y2="${y.toFixed(1)}" stroke="#e9e6df" stroke-opacity=".7" style="animation-delay:${d}s"/>`;
  }
  let side = '';
  for (let i = 0; i < 5; i++) side += `<rect class="fl" x="126" y="${440 - (i + 1) * 27 + 2}" width="98" height="23" fill="url(#ig1)" style="animation-delay:${(1.1 + i * 0.08).toFixed(2)}s"/>`;
  for (let i = 0; i < 7; i++) side += `<rect class="fl" x="626" y="${440 - (i + 1) * 27 + 2}" width="68" height="23" fill="url(#ig1)" style="animation-delay:${(1.2 + i * 0.08).toFixed(2)}s"/>`;
  return `<svg class="intro-art" viewBox="0 0 900 500" role="img" aria-label="Un edificio se dibuja en planos y se levanta piso a piso al amanecer">
    <defs>
      <linearGradient id="ig1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8d4ea" stop-opacity=".55"/><stop offset="1" stop-color="#5b75a6" stop-opacity=".35"/></linearGradient>
      <linearGradient id="ig2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2cf9f" stop-opacity=".5"/><stop offset="1" stop-color="#d6a46c" stop-opacity=".18"/></linearGradient>
      <radialGradient id="isun"><stop offset="0" stop-color="#ffe2bb"/><stop offset=".45" stop-color="#d6a46c" stop-opacity=".55"/><stop offset="1" stop-color="#d6a46c" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="sun"><circle cx="745" cy="110" r="90" fill="url(#isun)"/><circle cx="745" cy="110" r="22" fill="#ffe8c7"/></g>
    <polygon class="shadow" points="300,440 520,440 700,470 380,470" fill="#000" opacity=".5"/>
    <line class="ln" pathLength="1" x1="40" y1="440" x2="860" y2="440" stroke="#d6a46c" stroke-width="1.4" style="animation-delay:.25s"/>
    <path class="ln" pathLength="1" d="M120 440V300H230V440" stroke="#9fb2d3" style="animation-delay:.5s"/>
    <path class="ln" pathLength="1" d="M620 440V250H700L740 280V440" stroke="#9fb2d3" style="animation-delay:.7s"/>
    <path class="ln" pathLength="1" d="M330 440V90L420 50L510 90V440" stroke="#f2cf9f" stroke-width="1.6" style="animation-delay:.9s"/>
    <path class="ln" pathLength="1" d="M420 50V20M405 28H435" stroke="#f2cf9f" stroke-width="1.2" style="animation-delay:1.7s"/>
    <path class="ln" pathLength="1" d="M300 470V455M540 470V455M300 462H540" stroke="rgba(236,238,242,.5)" stroke-width=".8" style="animation-delay:1.9s"/>
    ${floors}${side}
    <text class="up" x="420" y="488" text-anchor="middle" style="animation-delay:2.1s">24 PISOS · 70,0 m</text>
  </svg>`;
}

/**
 * Muestra la intro sobre la aplicación y se resuelve al terminar (o al saltarla).
 * La aplicación sigue cargando detrás, así que al cerrar ya está lista.
 */
export function playIntro(user) {
  if (!introEnabled()) return Promise.resolve();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const first = (user?.fullName || '').trim().split(/\s+/)[0];
  const el = document.createElement('div');
  el.className = 'intro';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Bienvenida a CIVIA AI');
  el.innerHTML = `
    <div class="intro-grid" aria-hidden="true"></div>
    <div class="intro-top">
      <div class="intro-meta up" style="animation-delay:.2s">PLANO 01 · ALZADO PRINCIPAL · ESC 1:200</div>
      <button type="button" class="intro-skip" data-intro-close>Saltar intro</button>
    </div>
    <div class="intro-stage">${svg()}</div>
    <div class="intro-copy">
      <div class="intro-logo">CIVIA AI</div>
      <p class="up" style="animation-delay:3.2s">${first ? `Hola, ${esc(first)}.` : 'Hola.'} Estamos preparando tu estudio.</p>
      <div class="intro-progress up" style="animation-delay:3.3s"><i></i></div>
      <ul class="intro-steps">
        <li style="animation-delay:2s">Proyectos sincronizados</li>
        <li style="animation-delay:2.9s">Modelos listos sin conexión</li>
        <li style="animation-delay:3.8s">Biblioteca actualizada</li>
        <li style="animation-delay:4.7s">Copilot conectado</li>
      </ul>
      <button type="button" class="btn primary lg intro-go up" style="animation-delay:5s" data-intro-close>Entrar al estudio</button>
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
      setTimeout(() => { el.remove(); resolve(); }, reduced ? 0 : 650);
    };
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') close(); };
    const timer = setTimeout(close, reduced ? 1200 : 6400);
    document.addEventListener('keydown', onKey);
    el.querySelectorAll('[data-intro-close]').forEach((b) => { b.onclick = close; });
    el.querySelector('.intro-skip').focus({ preventScroll: true });
  });
}
