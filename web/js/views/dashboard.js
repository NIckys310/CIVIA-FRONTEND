// Panel de inicio.
import { api, session } from '../api.js';
import { $, coverArt, fmtBytes, fmtNum, html, icon, mount, relTime, STATUS_LABEL } from '../ui.js';
import { countUp } from '../motion.js';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export async function render(el) {
  const first = (session.user.fullName || '').split(' ')[0];
  mount(el, html`<div class="page-head"><div><div class="eyebrow gold">${new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    <h1>${greeting()}, <span class="chrome-text">${first}</span></h1></div></div>
    <div class="grid g5 kpi-grid">${Array.from({ length: 5 }, () => html`<div class="card skeleton" style="height:132px"></div>`)}</div>`);

  const d = await api.get('/dashboard');
  const kpi = (label, value, sub, ic) => html`<div class="card kpi glow"><div class="eyebrow">${label}</div><div class="ico">${icon(ic)}</div>
    <div class="val">${value}</div><div class="sub">${sub}</div></div>`;

  mount(el, html`
  <div class="page-head">
    <div>
      <div class="eyebrow gold">${new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1>${greeting()}, <span class="chrome-text">${first}</span></h1>
      <p class="muted">Tu estudio en un vistazo: proyectos, archivos, tareas y lo que CIVIA recomienda revisar.</p>
    </div>
    <div class="row wrap">
      <a class="btn" href="#/camera">${icon('camera')} Cámara</a>
      <a class="btn primary" href="#/projects?new">${icon('plus')} Nuevo proyecto</a>
    </div>
  </div>

  <div class="grid g5 kpi-grid" style="margin-bottom:18px">
    ${kpi('Proyectos', d.projects, 'activos', 'projects')}
    ${kpi('Planos', d.plans, 'arquitectónicos y técnicos', 'blueprint')}
    ${kpi('Modelos 3D', d.models, 'GLB · OBJ · STL', 'cube')}
    ${kpi('Fotos de obra', d.photos, 'desde la cámara', 'camera')}
    ${kpi('Área proyectada', `${fmtNum(d.builtArea, 0)} m²`, `${fmtBytes(d.storageBytes)} en archivos`, 'ruler')}
  </div>

  <div class="split">
    <div class="stack lg">
      <div class="card glow ask-hero">
        <div class="eyebrow gold">CIVIA Copilot</div>
        <h2 style="margin-top:12px;font-size:26px" class="display">Pregunta lo que necesites de <span class="chrome-text">ingeniería</span></h2>
        <p class="muted" style="margin-top:8px">Normativa, dimensiones, materiales, estructuras, sostenibilidad… o qué le falta a tu proyecto.</p>
        <form class="box" id="ask">
          <input name="q" placeholder="Ej. ¿Cómo calculo la huella y contrahuella de una escalera?" autocomplete="off">
          <button class="btn primary">${icon('sparkle')} Preguntar</button>
        </form>
        <div class="chips" style="margin-top:14px">
          ${['¿Qué debe tener un plano para licencia?', 'Pendiente máxima de una rampa', 'Estrategias bioclimáticas para clima cálido'].map((s) => html`<button class="chip" data-q="${s}">${s}</button>`)}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Proyectos recientes</h3><a class="btn sm ghost" href="#/projects">Ver todos ${icon('arrow')}</a></div>
        ${d.recentProjects.length ? html`<div class="grid g3" style="padding:18px">${d.recentProjects.map((p) => html`
          <a class="card hover project-card" href="#/projects/${p.id}">
            <div class="cover" style="height:96px">${coverArt(p.id, p.coverColor)}</div>
            <div class="body" style="padding:14px 16px"><h3 style="font-size:14.5px">${p.name}</h3>
            <div class="row" style="margin-top:8px"><span class="pill gold">${STATUS_LABEL[p.status] || p.status}</span><span class="faint" style="font-size:12px">${p.phase}</span></div></div>
          </a>`)}</div>`
        : html`<div class="empty">${icon('projects', 'big')}<h3>Crea tu primer proyecto</h3><p>Organiza planos, modelos 3D, fotos de obra, tareas y presupuesto.</p>
          <a class="btn primary" href="#/projects?new">${icon('plus')} Nuevo proyecto</a></div>`}
      </div>
    </div>

    <div class="stack lg">
      <div class="card">
        <div class="card-head"><h3>Mis tareas</h3><span class="pill">${d.myTasks.length}</span></div>
        <div class="card-body" style="padding-top:6px;padding-bottom:6px">
          ${d.myTasks.length ? d.myTasks.map((t) => html`<div class="rec ${t.priority === 'URGENT' || t.priority === 'HIGH' ? 'alta' : 'baja'}">
              <div class="mark">${icon('tasks')}</div><div><h4>${t.title}</h4><p>${t.dueDate ? `Vence ${new Date(t.dueDate).toLocaleDateString('es')}` : 'Sin fecha'}</p></div><span class="pill prio-${t.priority}">${t.status === 'IN_PROGRESS' ? 'En curso' : t.status === 'REVIEW' ? 'Revisión' : 'Pendiente'}</span></div>`)
          : html`<div class="empty" style="padding:30px 0"><p class="faint">No tienes tareas asignadas.</p></div>`}
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Actividad</h3></div>
        <div class="card-body" style="padding-top:4px">
          ${d.activity.length ? d.activity.slice(0, 10).map((a) => html`<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line);align-items:flex-start">
              <span class="dot" style="color:var(--gold);margin-top:8px;flex:none"></span>
              <div style="min-width:0"><div style="font-size:13.5px">${a.detail}</div><div class="hint">${a.userName} · ${a.projectName || ''} · ${relTime(a.createdAt)}</div></div></div>`)
          : html`<p class="faint" style="padding:16px 0">Aquí aparecerá lo que pase en tus proyectos.</p>`}
        </div>
      </div>
      <a class="card hover pad row" href="#/library" style="gap:16px">
        <div class="kpi" style="padding:0"><div class="ico" style="position:static">${icon('book')}</div></div>
        <div><h3>Biblioteca de ingeniería civil</h3><p class="muted" style="font-size:13px;margin-top:4px">${d.ai.articles} artículos y ${d.ai.terms} términos del glosario.</p></div>
        <span class="right">${icon('chevron')}</span>
      </a>
    </div>
  </div>`);

  el.querySelectorAll('.kpi .val').forEach((v) => countUp(v));
  const ask = (q) => { sessionStorage.setItem('civia-copilot-draft', q); location.hash = '#/copilot'; };
  $('#ask', el).addEventListener('submit', (e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) ask(q); });
  el.querySelectorAll('[data-q]').forEach((b) => { b.onclick = () => ask(b.dataset.q); });
}
