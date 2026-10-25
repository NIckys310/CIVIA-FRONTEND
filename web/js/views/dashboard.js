// Panel de inicio (Interfaz 2.1): bienvenida con skyline animado, indicadores con profundidad,
// proyectos con inclinación 3D, Copilot con borde vivo, tareas y actividad.
import { api, session } from '../api.js';
import { $, coverArt, fmtBytes, fmtNum, html, icon, mount, raw, relTime, STATUS_LABEL } from '../ui.js';
import { countUp, kinetic, revealOnScroll, tilt, typewriterPlaceholder } from '../motion.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

const today = () => new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
const plural = (n, one, many) => `${fmtNum(n, 0)} ${n === 1 ? one : many}`;

/** Skyline de líneas que se dibuja solo, con ventanas que se encienden (decorativo). */
const skyline = () => raw(`<svg class="hb-skyline" viewBox="0 0 420 200" aria-hidden="true" fill="none">
  <path class="sk-line" pathLength="1" d="M0 190H420"/>
  <path class="sk-line s1" pathLength="1" d="M30 190V120H80V190"/>
  <path class="sk-line s2" pathLength="1" d="M95 190V70L135 50L175 70V190"/>
  <path class="sk-line s3" pathLength="1" d="M190 190V30H250V190M220 30V12"/>
  <path class="sk-line s4" pathLength="1" d="M265 190V95H320V190"/>
  <path class="sk-line s5" pathLength="1" d="M335 190V130L365 112L395 130V190"/>
  ${[[106, 86], [126, 86], [146, 86], [106, 110], [146, 110], [126, 134], [200, 48], [222, 48], [236, 72], [200, 96], [222, 120], [236, 144],
    [276, 112], [298, 136], [276, 160], [40, 136], [62, 160], [346, 148], [372, 166]]
    .map(([x, y], i) => `<rect class="sk-win" x="${x}" y="${y}" width="9" height="12" rx="1" style="animation-delay:${(1.6 + (i * 0.37) % 3).toFixed(2)}s"/>`).join('')}
  <circle class="sk-sun" cx="372" cy="46" r="16"/>
</svg>`);

function summaryChips(d) {
  const chips = [
    [icon('projects'), d.projects ? plural(d.projects, 'proyecto activo', 'proyectos activos') : 'Sin proyectos aún'],
    [icon('tasks'), d.myTasks.length ? plural(d.myTasks.length, 'tarea pendiente', 'tareas pendientes') : 'Sin tareas pendientes'],
    [icon('cube'), plural(d.models, 'modelo 3D', 'modelos 3D')],
  ];
  return html`<ul class="hb-chips">${chips.map(([ic, t], i) => html`<li style="--ci:${i}">${ic}<span>${t}</span></li>`)}</ul>`;
}

export async function render(el, _params, ctx = {}) {
  const first = (session.user.fullName || '').split(' ')[0];
  const head = (chips) => html`
    <section class="hero-banner hb2">
      <div class="hero-banner-grid" aria-hidden="true"></div>
      <div class="hb-aurora" aria-hidden="true"><i></i><i></i></div>
      ${skyline()}
      <div class="hero-banner-copy">
        <div class="eyebrow gold hb-date">${today()}</div>
        <h1 class="hb-title">${greeting()}, <span class="fx-accent">${first}</span></h1>
        ${chips}
      </div>
      <div class="hero-banner-actions">
        <a class="btn primary lg sheen" href="#/projects?new">${icon('plus')} Nuevo proyecto</a>
        <a class="btn lg glass-btn" href="#/viewer">${icon('cube')} Modelado 3D</a>
      </div>
    </section>`;

  mount(el, html`${head(html`<p class="muted">Preparando tu estudio…</p>`)}
    <div class="kpi-row">${Array.from({ length: 5 }, () => html`<div class="card skeleton" style="height:140px"></div>`)}</div>`);

  const d = await api.get('/dashboard');
  const kpi = (label, value, sub, ic, href, i) => html`<a class="card kpi kpi3" href="${href}" style="--ki:${i}">
    <span class="kpi3-glow" aria-hidden="true"></span>
    <div class="kpi2-top"><span class="eyebrow">${label}</span><span class="kpi3-ico">${icon(ic)}<i aria-hidden="true"></i></span></div>
    <div class="val">${value}</div><div class="sub">${sub}</div>
    <span class="kpi3-line" aria-hidden="true"></span></a>`;

  const engine = ctx.aiStatus?.();
  mount(el, html`
  ${head(summaryChips(d))}

  <div class="kpi-row">
    ${kpi('Proyectos', d.projects, 'activos', 'projects', '#/projects', 0)}
    ${kpi('Planos', d.plans, 'arquitectónicos y técnicos', 'blueprint', '#/projects', 1)}
    ${kpi('Modelos 3D', d.models, 'GLB · OBJ · STL', 'cube', '#/viewer', 2)}
    ${kpi('Fotos de obra', d.photos, 'desde la cámara', 'camera', '#/camera', 3)}
    ${kpi('Área proyectada', `${fmtNum(d.builtArea, 0)} m²`, `${fmtBytes(d.storageBytes)} en archivos`, 'ruler', '#/projects', 4)}
  </div>

  <div class="dash-grid">
    <div class="stack lg">
      <section class="card sec">
        <div class="card-head"><h3 class="sec-title">Proyectos recientes</h3><a class="btn sm ghost link-arrow" href="#/projects">Ver todos ${icon('arrow')}</a></div>
        ${d.recentProjects.length ? html`<div class="project-grid">${d.recentProjects.map((p) => html`
          <a class="card project-card pc2" href="#/projects/${p.id}">
            <div class="cover">${coverArt(p.id, p.coverColor)}<span class="pill gold cover-pill"><span class="dot"></span>${STATUS_LABEL[p.status] || p.status}</span></div>
            <div class="body"><h3>${p.name}</h3><div class="pc2-meta"><span>${p.phase || 'Sin fase'}</span><span class="pc2-go">${icon('arrow')}</span></div></div>
            <span class="pc2-glare" aria-hidden="true"></span>
          </a>`)}</div>`
        : html`<div class="empty empty-art">${icon('projects', 'big')}<h3>Crea tu primer proyecto</h3><p>Organiza planos, modelos 3D, fotos de obra, tareas y presupuesto.</p>
          <a class="btn primary" href="#/projects?new">${icon('plus')} Nuevo proyecto</a></div>`}
      </section>

      <section class="card sec">
        <div class="card-head"><h3 class="sec-title">Actividad</h3></div>
        <div class="card-body timeline">
          ${d.activity.length ? d.activity.slice(0, 8).map((a, i) => html`<div class="tl-item" style="--ti:${i}"><span class="tl-dot" aria-hidden="true"></span>
              <div style="min-width:0"><div class="tl-text">${a.detail}</div><div class="hint">${a.userName}${a.projectName ? ` · ${a.projectName}` : ''} · ${relTime(a.createdAt)}</div></div></div>`)
          : html`<div class="empty-mini">${icon('clock')}<span>Aquí aparecerá lo que pase en tus proyectos.</span></div>`}
        </div>
      </section>
    </div>

    <div class="stack lg">
      <section class="card copilot-card cp2">
        <span class="cp2-border" aria-hidden="true"></span>
        <div class="row" style="gap:12px">
          <span class="ai-orb" aria-hidden="true"><i></i>${icon('sparkle')}</span>
          <div style="min-width:0"><h3 class="sec-title">CIVIA Copilot</h3>
            <div class="cp2-engine"><span class="live-dot"></span>${engine?.llm ? engine.engine : 'Listo para ayudarte'}</div></div>
        </div>
        <p class="muted" style="font-size:13px;margin:12px 0 14px">Normativa, dimensiones, materiales, estructuras… o qué le falta a tu proyecto.</p>
        <form class="ask-row" id="ask">
          <label class="sr-only" for="ask-q">Pregunta al Copilot</label>
          <input class="input" id="ask-q" name="q" autocomplete="off" placeholder="Pregunta lo que necesites…">
          <button class="btn primary icon" aria-label="Preguntar">${icon('arrow')}</button>
        </form>
        <div class="chips" style="margin-top:12px">
          ${['¿Qué debe tener un plano para licencia?', 'Estrategias bioclimáticas para clima frío'].map((s) => html`<button class="chip chip-glow" type="button" data-q="${s}">${s}</button>`)}
        </div>
      </section>

      <section class="card sec">
        <div class="card-head"><h3 class="sec-title">Mis tareas</h3><span class="pill count-pill">${d.myTasks.length}</span></div>
        <div class="card-body" style="padding-top:6px;padding-bottom:6px">
          ${d.myTasks.length ? d.myTasks.map((t) => html`<div class="rec ${t.priority === 'URGENT' || t.priority === 'HIGH' ? 'alta' : 'baja'}">
              <div class="mark">${icon('tasks')}</div><div><h4>${t.title}</h4><p>${t.dueDate ? `Vence ${new Date(t.dueDate).toLocaleDateString('es')}` : 'Sin fecha'}</p></div><span class="pill prio-${t.priority}">${t.status === 'IN_PROGRESS' ? 'En curso' : t.status === 'REVIEW' ? 'Revisión' : 'Pendiente'}</span></div>`)
          : html`<div class="empty-mini done">${icon('check')}<span>Todo al día. No tienes tareas asignadas.</span></div>`}
        </div>
      </section>

      <a class="card lib-card" href="#/library">
        <span class="lib-books" aria-hidden="true"><i></i><i></i><i></i></span>
        <div style="min-width:0"><h3>Biblioteca de ingeniería civil</h3><p class="muted" style="font-size:13px;margin-top:4px">${fmtNum(d.ai.articles, 0)} artículos y ${fmtNum(d.ai.terms, 0)} términos del glosario.</p></div>
        <span class="right lib-go">${icon('chevron')}</span>
      </a>
    </div>
  </div>`);

  el.querySelectorAll('.hb-title, .hb-date').forEach(kinetic);
  el.querySelectorAll('.kpi .val').forEach((v) => countUp(v, 1200));
  tilt(el, '.kpi3, .pc2', 5);
  const stopReveal = revealOnScroll(el, '.dash-grid .sec, .dash-grid .copilot-card, .lib-card');
  const stopType = typewriterPlaceholder($('#ask-q', el), [
    '¿Qué pendiente máxima debe tener una rampa?',
    '¿Cuántos pisos permite un índice de construcción de 4?',
    '¿Qué retiro exige la norma para 8 pisos?',
    '¿Cómo calculo la huella de una escalera?',
  ]);
  const ask = (q) => { sessionStorage.setItem('civia-copilot-draft', q); location.hash = '#/copilot'; };
  $('#ask', el).addEventListener('submit', (e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) ask(q); });
  el.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => ask(b.dataset.q); });
  return () => { stopType(); stopReveal(); };
}
