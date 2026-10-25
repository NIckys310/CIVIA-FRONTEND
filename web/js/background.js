// Fondo animado de la aplicación: auroras de luz, retícula de plano en perspectiva, ciudad de
// líneas con ventanas que se encienden (con paralaje) y puntos de obra que flotan unidos por
// líneas. Todo muy tenue para no competir con el contenido.
//
// Rendimiento: el lienzo de partículas usa pocos puntos, limita los fotogramas a ~30 por segundo,
// se pausa con la pestaña oculta y no se dibuja con «reducir movimiento» (queda una escena fija).

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Ciudad isométrica de líneas: edificios con ventanas que se encienden en tiempos distintos. */
function skylineSvg() {
  const W = 1600;
  const base = 360;
  let x = -20;
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  let bodies = '';
  let windows = '';
  while (x < W) {
    const w = 30 + Math.round(rnd() * 56);
    const h = 40 + Math.round(rnd() * (rnd() > 0.85 ? 220 : 130));
    const top = base - h;
    const roof = rnd();
    const tall = h > 150;
    bodies += `<path d="M${x} ${base}V${top}${roof > 0.7 ? `L${x + w / 2} ${top - 18}L${x + w} ${top}` : `H${x + w}`}V${base}"/>`;
    if (tall && rnd() > 0.4) bodies += `<path d="M${x + w / 2} ${top - (roof > 0.7 ? 18 : 0)}v-${16 + Math.round(rnd() * 22)}"/>`;
    const cols = Math.max(1, Math.floor((w - 10) / 12));
    const rows = Math.floor((h - 16) / 16);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rnd() > 0.32) continue;
        const d = (rnd() * 9).toFixed(2);
        const dur = (4 + rnd() * 6).toFixed(2);
        windows += `<rect x="${x + 6 + c * 12}" y="${top + 10 + r * 16}" width="5" height="7" style="animation-delay:${d}s;animation-duration:${dur}s"/>`;
      }
    }
    x += w + 6 + Math.round(rnd() * 18);
  }
  return `<svg class="bg-city" viewBox="0 0 ${W} ${base + 10}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs><linearGradient id="bgc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb2d3" stop-opacity=".09"/><stop offset="1" stop-color="#d6a46c" stop-opacity=".03"/></linearGradient></defs>
    <g class="bg-city-body">${bodies}</g><g class="bg-city-win">${windows}</g>
    <line class="bg-city-ground" x1="0" y1="${base}" x2="${W}" y2="${base}"/>
  </svg>`;
}

/** Puntos de obra que flotan y se unen con líneas finas cuando están cerca. */
function particles(canvas) {
  const ctx = canvas.getContext('2d');
  let w = 0; let h = 0; let dpr = 1;
  let pts = [];
  let raf = 0; let last = 0;
  const mouse = { x: -1e4, y: -1e4 };
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(56, Math.max(22, (w * h) / 32000)));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      r: 0.6 + Math.random() * 1.4, gold: Math.random() > 0.55, ph: Math.random() * Math.PI * 2,
    }));
  };
  const draw = (t) => {
    raf = requestAnimationFrame(draw);
    if (t - last < 33) return; // ~30 fps
    last = t;
    ctx.clearRect(0, 0, w, h);
    const link = Math.min(170, w / 7);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      // Se apartan suavemente del cursor.
      const dx = p.x - mouse.x; const dy = p.y - mouse.y; const d2 = dx * dx + dy * dy;
      if (d2 < 14000) { p.x += dx * 0.012; p.y += dy * 0.012; }
    }
    ctx.lineWidth = 0.6;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]; const b = pts[j];
        const dx = a.x - b.x; const dy = a.y - b.y; const d = Math.hypot(dx, dy);
        if (d > link) continue;
        const o = (1 - d / link) * 0.16;
        ctx.strokeStyle = a.gold && b.gold ? `rgba(214,164,108,${o})` : `rgba(159,178,211,${o})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const p of pts) {
      const tw = 0.55 + Math.sin(t / 900 + p.ph) * 0.35;
      ctx.fillStyle = p.gold ? `rgba(242,207,159,${0.55 * tw})` : `rgba(200,212,234,${0.45 * tw})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      if (p.r > 1.6) { // cruz de replanteo en los puntos más grandes
        ctx.strokeStyle = `rgba(214,164,108,${0.25 * tw})`;
        ctx.beginPath(); ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y); ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5); ctx.stroke();
      }
    }
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(draw); };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}

/** Inserta el fondo una sola vez (detrás de toda la app). */
export function mountBackground(host = document.body) {
  if (document.getElementById('bg-scene')) return;
  const el = document.createElement('div');
  el.id = 'bg-scene';
  el.className = 'bg-scene';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="bg-aurora"><i class="a1"></i><i class="a2"></i><i class="a3"></i></div>
    <div class="bg-floor"><div class="bg-floor-grid"></div></div>
    <div class="bg-horizon"></div>
    <div class="bg-city-wrap">${skylineSvg()}</div>
    <canvas class="bg-particles"></canvas>
    <div class="bg-vignette"></div>
    <div class="bg-grain"></div>`;
  host.prepend(el);
  if (reduced()) { el.classList.add('static'); return; }
  particles(el.querySelector('.bg-particles'));
  // Paralaje suave de la ciudad y las auroras con el cursor (solo con ratón).
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = 0; let ty = 0; let cx = 0; let cy = 0; let pending = false;
    window.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5); ty = (e.clientY / window.innerHeight - 0.5);
      if (pending) return;
      pending = true;
      requestAnimationFrame(function step() {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        el.style.setProperty('--px', cx.toFixed(4));
        el.style.setProperty('--py', cy.toFixed(4));
        if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(step); else pending = false;
      });
    }, { passive: true });
  }
}
