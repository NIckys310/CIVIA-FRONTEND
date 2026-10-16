// Lista de proyectos y creación.
import { api } from '../api.js';
import { $, busy, coverArt, fmtNum, formData, html, icon, modal, mount, on, relTime, STATUS_LABEL, toast } from '../ui.js';

export const PROJECT_TYPES = ['Vivienda unifamiliar', 'Vivienda multifamiliar', 'Oficinas', 'Comercio', 'Uso mixto', 'Educación', 'Salud',
  'Hotelería', 'Industrial', 'Cultural', 'Espacio público', 'Interiorismo', 'Remodelación', 'Otro'];

export function projectForm(p = {}) {
  return html`<form id="project-form" class="form-grid">
    <div class="field full"><label>Nombre del proyecto</label><input class="input" name="name" required value="${p.name || ''}" placeholder="Casa Loma"></div>
    <div class="field"><label>Tipo</label><select class="input" name="type">${PROJECT_TYPES.map((t) => html`<option ${p.type === t ? 'selected' : ''}>${t}</option>`)}</select></div>
    <div class="field"><label>Estado</label><select class="input" name="status">${Object.entries(STATUS_LABEL).map(([k, v]) => html`<option value="${k}" ${(p.status || 'DESIGN') === k ? 'selected' : ''}>${v}</option>`)}</select></div>
    <div class="field"><label>Ubicación</label><input class="input" name="location" value="${p.location || ''}" placeholder="Ciudad, país"></div>
    <div class="field"><label>Dirección</label><input class="input" name="address" value="${p.address || ''}"></div>
    <div class="field"><label>Área del lote (m²)</label><input class="input" name="lotArea" type="number" step="any" min="0" value="${p.lotArea ?? ''}"></div>
    <div class="field"><label>Área construida (m²)</label><input class="input" name="builtArea" type="number" step="any" min="0" value="${p.builtArea ?? ''}"></div>
    <div class="field"><label>Pisos</label><input class="input" name="floors" type="number" min="0" value="${p.floors ?? ''}"></div>
    <div class="field"><label>Presupuesto estimado</label><input class="input" name="budgetEstimate" type="number" step="any" min="0" value="${p.budgetEstimate ?? ''}"></div>
    <div class="field"><label>Inicio</label><input class="input" name="startDate" type="date" value="${p.startDate || ''}"></div>
    <div class="field"><label>Entrega</label><input class="input" name="dueDate" type="date" value="${p.dueDate || ''}"></div>
    <div class="field full"><label>Descripción y programa</label><textarea class="input" name="description" placeholder="Concepto, programa arquitectónico, requisitos del cliente…">${p.description || ''}</textarea></div>
  </form>`;
}

export function readProjectForm(form) {
  const d = formData(form);
  const num = (v) => (v === '' || v == null ? null : Number(v));
  return {
    name: d.name, type: d.type, status: d.status, location: d.location, address: d.address, description: d.description,
    lotArea: num(d.lotArea), builtArea: num(d.builtArea), floors: num(d.floors), budgetEstimate: num(d.budgetEstimate),
    startDate: d.startDate || null, dueDate: d.dueDate || null,
  };
}

export function openCreate() {
  const m = modal({
    title: 'Nuevo proyecto',
    eyebrow: 'Estudio',
    wide: true,
    body: projectForm(),
    foot: html`<button class="btn ghost" data-cancel>Cancelar</button><button class="btn primary" data-save data-busy="Creando…">${icon('plus')} Crear proyecto</button>`,
  });
  m.el.querySelector('[data-cancel]').onclick = m.close;
  const save = m.el.querySelector('[data-save]');
  const submit = () => busy(save, async () => {
    const form = $('#project-form', m.el);
    if (!form.name.value.trim()) { form.name.focus(); return; }
    const p = await api.post('/projects', readProjectForm(form));
    m.close();
    toast('Proyecto creado');
    location.hash = `#/projects/${p.id}`;
  });
  save.onclick = submit;
  $('#project-form', m.el).addEventListener('submit', (e) => { e.preventDefault(); submit(); });
}

export async function render(el, { query }) {
  mount(el, html`<div class="page-head"><div><div class="eyebrow gold">Estudio</div><h1>Proyectos</h1></div></div>
    <div class="grid g3">${Array.from({ length: 3 }, () => html`<div class="card skeleton" style="height:260px"></div>`)}</div>`);
  const projects = await api.get('/projects');
  let filter = '';
  let status = '';

  const draw = () => {
    const list = projects.filter((p) => !p.archived)
      .filter((p) => !status || p.status === status)
      .filter((p) => !filter || `${p.name} ${p.location || ''} ${p.type || ''} ${p.code || ''}`.toLowerCase().includes(filter));
    mount($('#list', el), list.length ? html`${list.map((p) => html`
      <a class="card hover project-card" href="#/projects/${p.id}">
        <div class="cover">${coverArt(p.id, p.coverColor)}
          <div style="position:absolute;top:14px;left:16px" class="row"><span class="pill gold">${STATUS_LABEL[p.status] || p.status}</span>${p.role !== 'OWNER' ? html`<span class="pill">${p.role === 'EDITOR' ? 'Editor' : 'Lector'}</span>` : ''}</div>
          <div style="position:absolute;top:14px;right:16px" class="mono faint">${p.code || ''}</div>
        </div>
        <div class="body">
          <div class="eyebrow" style="font-size:9.5px">${p.type || 'Proyecto'}</div>
          <h3 style="margin-top:8px;font-size:17px">${p.name}</h3>
          <div class="meta">
            ${p.location ? html`<span>${icon('pin')}${p.location}</span>` : ''}
            ${p.builtArea ? html`<span>${icon('ruler')}${fmtNum(p.builtArea, 0)} m²</span>` : ''}
            <span>${icon('blueprint')}${p.stats.plans} planos</span>
            <span>${icon('cube')}${p.stats.models} 3D</span>
            <span>${icon('clock')}${relTime(p.updatedAt)}</span>
          </div>
        </div>
      </a>`)}`
      : html`<div class="card" style="grid-column:1/-1"><div class="empty">${icon('projects', 'big')}<h3>${projects.length ? 'Sin resultados' : 'Aún no tienes proyectos'}</h3>
        <p>${projects.length ? 'Prueba con otro filtro.' : 'Crea un proyecto para subir planos, modelos 3D y fotos, y recibir recomendaciones de CIVIA.'}</p>
        ${projects.length ? '' : html`<button class="btn primary" data-new>${icon('plus')} Nuevo proyecto</button>`}</div></div>`);
  };

  mount(el, html`
  <div class="page-head">
    <div><div class="eyebrow gold">Estudio</div><h1>Proyectos</h1><p class="muted">${projects.length} proyecto${projects.length === 1 ? '' : 's'} en los que participas.</p></div>
    <button class="btn primary" data-new>${icon('plus')} Nuevo proyecto</button>
  </div>
  <div class="row wrap" style="margin-bottom:18px">
    <label class="search" style="max-width:360px">${icon('search')}<input id="filter" placeholder="Filtrar por nombre, ubicación o código"></label>
    <div class="tabs" id="status-tabs">
      <button class="active" data-status="">Todos</button>
      ${Object.entries(STATUS_LABEL).map(([k, v]) => html`<button data-status="${k}">${v}</button>`)}
    </div>
  </div>
  <div class="grid g3" id="list"></div>`);

  draw();
  $('#filter', el).addEventListener('input', (e) => { filter = e.target.value.toLowerCase().trim(); draw(); });
  on(el, 'click', '[data-status]', (e, b) => {
    status = b.dataset.status;
    el.querySelectorAll('[data-status]').forEach((x) => x.classList.toggle('active', x === b));
    draw();
  });
  on(el, 'click', '[data-new]', openCreate);
  if (query?.has('new')) openCreate();
}
