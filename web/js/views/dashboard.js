// Panel de inicio (Interfaz 2.0): bienvenida, indicadores, proyectos, Copilot, tareas y actividad.
import { api, session } from '../api.js';
import { $, coverArt, fmtBytes, fmtNum, html, icon, mount, relTime, STATUS_LABEL } from '../ui.js';
import { countUp } from '../motion.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

const today = () => new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
const plural = (n, one, many) => `${fmtNum(n, 0)} ${n === 1 ? one : many}`;

function summary(d) {
  const parts = [];
  parts.push(d.projects ? plural(d.projects, 'proyecto activo', 'proyectos activos') : 'Aún no tienes proyectos');
  if (d.myTasks.length) parts.push(plural(d.myTasks.length, 'tarea pendiente', 'tareas pendientes'));
  if (d.models) parts.push(plural(d.models, 'modelo 3D', 'modelos 3D'));
  return `${parts.join(' · ')}.`;
}

export async function render(el) {
  const first = (session.user.fullName || '').split(' ')[0];
  const head = (sub) => html`
    <section class="hero-banner">
      <div class="hero-banner-grid" aria-hidden="true"></div>
      <div class="hero-banner-copy">
        <div class="eyebrow gold">${today()}</div>
        <h1>${greeting()}, <span class="chrome-text">${first}</span></h1>
        <p class="muted">${sub}</p>
      </div>
      <div class="hero-banner-actions">
        <a class="btn primary lg sheen" href="#/projects?new">${icon('plus')} Nuevo proyecto</a>
        <a class="btn lg" href="#/viewer">${icon('cube')} Modelado 3D</a>
      </div>
    </section>`;

  mount(el, html`${head('Cargando tu estudio…')}
    <div class="kpi-row">${Array.from({ length: 5 }, () => html`<div class="card skeleton" style="height:128px"></div>`)}</div>`);

  const d = await api.get('/dashboard');
  const kpi = (label, value, sub, ic, href) => html`<a class="card kpi kpi2 lift" href="${href}">
    <div class="kpi2-top"><span class="eyebrow">${label}</span><span class="kpi2-ico">${icon(ic)}</span></div>
    <div class="val">${value}</div><div class="sub">${sub}</div></a>`;

  mount(el, html`
  ${head(summary(d))}

  <div class="kpi-row">
    ${kpi('Proyectos', d.projects, 'activos', 'projects', '#/projects')}
    ${kpi('Planos', d.plans, 'arquitectónicos y técnicos', 'blueprint', '#/projects')}
    ${kpi('Modelos 3D', d.models, 'GLB · OBJ · STL', 'cube', '#/viewer')}
    ${kpi('Fotos de obra', d.photos, 'desde la cámara', 'camera', '#/camera')}
    ${kpi('Área proyectada', `${fmtNum(d.builtArea, 0)} m²`, `${fmtBytes(d.storageBytes)} en archivos`, 'ruler', '#/projects')}
  </div>

  <div class="dash-grid">
    <div class="stack lg">
      <section class="card">
        <div class="card-head"><h3>Proyectos recientes</h3><a class="btn sm ghost" href="#/projects">Ver todos ${icon('arrow')}</a></div>
        ${d.recentProjects.length ? html`<div class="project-grid">${d.recentProjects.map((p) => html`
          <a class="card hover project-card lift" href="#/projects/${p.id}">
            <div class="cover">${coverArt(p.id, p.coverColor)}<span class="pill gold cover-pill">${STATUS_LABEL[p.status] || p.status}</span></div>
            <div class="body"><h3>${p.name}</h3><div class="faint" style="font-size:12.5px;margin-top:6px">${p.phase || 'Sin fase'}</div></div>
          </a>`)}</div>`
        : html`<div class="empty">${icon('projects', 'big')}<h3>Crea tu primer proyecto</h3><p>Organiza planos, modelos 3D, fotos de obra, tareas y presupuesto.</p>
          <a class="btn primary" href="#/projects?new">${icon('plus')} Nuevo proyecto</a></div>`}
      </section>

      <section class="card">
        <div class="card-head"><h3>Actividad</h3></div>
        <div class="card-body timeline">
          ${d.activity.length ? d.activity.slice(0, 8).map((a) => html`<div class="tl-item"><span class="tl-dot" aria-hidden="true"></span>
              <div style="min-width:0"><div class="tl-text">${a.detail}</div><div class="hint">${a.userName}${a.projectName ? ` · ${a.projectName}` : ''} · ${relTime(a.createdAt)}</div></div></div>`)
          : html`<p class="faint" style="padding:8px 0">Aquí aparecerá lo que pase en tus proyectos.</p>`}
        </div>
      </section>
    </div>

    <div class="stack lg">
      <section class="card copilot-card">
        <div class="row" style="gap:10px"><span class="ai-badge">${icon('sparkle')}</span><h3>CIVIA Copilot</h3></div>
        <p class="muted" style="font-size:13px;margin:10px 0 14px">Normativa, dimensiones, materiales, estructuras… o qué le falta a tu proyecto.</p>
        <form class="ask-row" id="ask">
          <label class="sr-only" for="ask-q">Pregunta al Copilot</label>
          <input class="input" id="ask-q" name="q" placeholder="¿Pendiente máxima de una rampa?" autocomplete="off">
          <button class="btn primary icon" aria-label="Preguntar">${icon('arrow')}</button>
        </form>
        <div class="chips" style="margin-top:12px">
          ${['¿Qué debe tener un plano para licencia?', 'Estrategias bioclimáticas para clima frío'].map((s) => html`<button class="chip" type="button" data-q="${s}">${s}</button>`)}
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Mis tareas</h3><span class="pill">${d.myTasks.length}</span></div>
        <div class="card-body" style="padding-top:6px;padding-bottom:6px">
          ${d.myTasks.length ? d.myTasks.map((t) => html`<div class="rec ${t.priority === 'URGENT' || t.priority === 'HIGH' ? 'alta' : 'baja'}">
              <div class="mark">${icon('tasks')}</div><div><h4>${t.title}</h4><p>${t.dueDate ? `Vence ${new Date(t.dueDate).toLocaleDateString('es')}` : 'Sin fecha'}</p></div><span class="pill prio-${t.priority}">${t.status === 'IN_PROGRESS' ? 'En curso' : t.status === 'REVIEW' ? 'Revisión' : 'Pendiente'}</span></div>`)
          : html`<div class="empty" style="padding:26px 0"><p class="faint">No tienes tareas asignadas.</p></div>`}
        </div>
      </section>

      <a class="card hover pad row lift" href="#/library" style="gap:16px">
        <span class="kpi2-ico">${icon('book')}</span>
        <div style="min-width:0"><h3>Biblioteca de ingeniería civil</h3><p class="muted" style="font-size:13px;margin-top:4px">${fmtNum(d.ai.articles, 0)} artículos y ${fmtNum(d.ai.terms, 0)} términos del glosario.</p></div>
        <span class="right">${icon('chevron')}</span>
      </a>
    </div>
  </div>`);

  el.querySelectorAll('.kpi .val').forEach((v) => countUp(v));
  const ask = (q) => { sessionStorage.setItem('civia-copilot-draft', q); location.hash = '#/copilot'; };
  $('#ask', el).addEventListener('submit', (e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) ask(q); });
  el.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => ask(b.dataset.q); });
}
