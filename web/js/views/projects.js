// Lista de proyectos y creación.
import { api } from '../api.js';
import { $, busy, coverArt, fmtNum, formData, html, icon, modal, mount, on, relTime, STATUS_LABEL, toast } from '../ui.js';
import { fieldRules, formatNumber, live, liveThousands, parseNumber } from '../validate.js';
import { tilt } from '../motion.js';

export const PROJECT_TYPES = ['Vivienda unifamiliar', 'Vivienda multifamiliar', 'Oficinas', 'Comercio', 'Uso mixto', 'Educación', 'Salud',
  'Hotelería', 'Industrial', 'Cultural', 'Espacio público', 'Interiorismo', 'Remodelación', 'Otro'];

/** Campo con estado (✓ / !), prefijo o unidad y mensaje de validación debajo. */
const field = (name, label, { value = '', type = 'text', inputmode = 'text', placeholder = '', prefix = '', suffix = '', required = false, full = false, counter = 0 } = {}) => html`
  <div class="field ${full ? 'full' : ''}" data-field="${name}">
    <div class="label-row"><label for="pf-${name}">${label}${required ? html`<span class="req" aria-hidden="true"> *</span>` : ''}</label>
      ${counter ? html`<span class="counter mono" data-counter="${name}">0/${counter}</span>` : ''}</div>
    <div class="input-wrap affixed">
      ${prefix ? html`<span class="affix pre">${prefix}</span>` : ''}
      <input class="input" id="pf-${name}" name="${name}" type="${type}" inputmode="${inputmode}" placeholder="${placeholder}" value="${value}" ${required ? 'required' : ''} aria-describedby="pf-${name}-msg" autocomplete="off">
      ${suffix ? html`<span class="affix post">${suffix}</span>` : ''}
      <span class="state" aria-hidden="true"></span>
    </div>
    <div class="field-msg" id="pf-${name}-msg" aria-live="polite"></div>
  </div>`;

const fmtField = (v, dec = 2) => (v == null || v === '' ? '' : formatNumber(Number(v), dec));

export function projectForm(p = {}) {
  return html`<form id="project-form" class="project-form" novalidate>
    <div class="form-summary" id="pf-summary" role="alert" hidden></div>
    <fieldset><legend class="eyebrow gold">Identificación</legend>
      <div class="form-grid">
        ${field('name', 'Nombre del proyecto', { value: p.name || '', placeholder: 'Ej. Torre Mirador', required: true, full: true, counter: 120 })}
        <div class="field"><label for="pf-type">Tipo</label><select class="input" id="pf-type" name="type">${PROJECT_TYPES.map((t) => html`<option ${p.type === t ? 'selected' : ''}>${t}</option>`)}</select></div>
        <div class="field"><label for="pf-status">Estado</label><select class="input" id="pf-status" name="status">${Object.entries(STATUS_LABEL).map(([k, v]) => html`<option value="${k}" ${(p.status || 'DESIGN') === k ? 'selected' : ''}>${v}</option>`)}</select></div>
        ${field('location', 'Municipio', { value: p.location || '', placeholder: 'Pasto, Nariño' })}
        ${field('address', 'Dirección', { value: p.address || '', placeholder: 'Calle 18 # 25-40' })}
      </div>
    </fieldset>
    <fieldset><legend class="eyebrow gold">Predio y alcance</legend>
      <div class="form-grid">
        ${field('lotArea', 'Área del lote', { value: fmtField(p.lotArea), inputmode: 'decimal', suffix: 'm²', placeholder: '600' })}
        ${field('builtArea', 'Área construida', { value: fmtField(p.builtArea), inputmode: 'decimal', suffix: 'm²', placeholder: 'Opcional' })}
        ${field('floors', 'Pisos', { value: p.floors ?? '', inputmode: 'numeric', placeholder: 'Sin límite' })}
        ${field('budgetEstimate', 'Presupuesto estimado', { value: fmtField(p.budgetEstimate, 0), inputmode: 'numeric', prefix: '$', suffix: 'COP', placeholder: '1.250.000.000' })}
      </div>
    </fieldset>
    <fieldset><legend class="eyebrow gold">Calendario</legend>
      <div class="form-grid">
        ${field('startDate', 'Inicio', { value: p.startDate || '', type: 'date' })}
        ${field('dueDate', 'Entrega estimada', { value: p.dueDate || '', type: 'date' })}
      </div>
    </fieldset>
    <div class="field full"><div class="label-row"><label for="pf-description">Descripción y programa</label><span class="counter mono" data-counter="description">0/2000</span></div>
      <textarea class="input" id="pf-description" name="description" maxlength="2000" placeholder="Concepto, programa arquitectónico, requisitos del cliente…">${p.description || ''}</textarea></div>
  </form>`;
}

/**
 * Validación en vivo del formulario de proyecto. Devuelve `check()`: valida todo, muestra el resumen
 * de errores con enlaces a cada campo y enfoca el primero. Los avisos (ámbar) no bloquean.
 */
export function wireProjectForm(form) {
  const $f = (n) => form.elements[n];
  const label = (n) => form.querySelector(`label[for="pf-${n}"]`)?.firstChild?.textContent?.trim() || n;
  const rulesByField = {
    name: fieldRules.text('El nombre', { min: 3, max: 120 }),
    location: fieldRules.text('El municipio', { min: 3, max: 120, required: false }),
    address: fieldRules.text('La dirección', { min: 4, max: 200, required: false }),
    lotArea: fieldRules.positive('El área del lote', { unit: 'm²', warn: (n) => (n < 36 ? 'Lote muy pequeño (menos de 36 m²); revisa las unidades.' : null) }),
    builtArea: fieldRules.positive('El área construida', {
      unit: 'm²',
      warn: (n) => { const lot = parseNumber($f('lotArea').value); return lot > 0 && n > lot * 30 ? 'Supera 30 veces el área del lote; confirma la cifra.' : null; },
    }),
    floors: fieldRules.integer('Pisos', { warnAbove: 80 }),
    budgetEstimate: fieldRules.money({ perUnit: () => parseNumber($f('builtArea').value) || parseNumber($f('lotArea').value) }),
    dueDate: fieldRules.dateAfter('La fecha de inicio', () => $f('startDate').value),
  };
  const controls = Object.entries(rulesByField).map(([n, rule]) => [$f(n), live($f(n), rule)]);
  liveThousands($f('budgetEstimate'));
  // Áreas: al salir del campo quedan con el formato colombiano (1.250,5).
  ['lotArea', 'builtArea'].forEach((n) => $f(n).addEventListener('blur', () => {
    const v = parseNumber($f(n).value);
    if (v > 0) $f(n).value = formatNumber(v);
  }));
  // Lo que depende de otros campos se revisa de nuevo cuando estos cambian.
  const refresh = (n) => controls.find(([i]) => i === $f(n))?.[1].refresh();
  $f('startDate').addEventListener('change', () => refresh('dueDate'));
  ['lotArea', 'builtArea'].forEach((n) => $f(n).addEventListener('input', () => { refresh('budgetEstimate'); refresh('builtArea'); }));
  // Contadores de caracteres.
  form.querySelectorAll('[data-counter]').forEach((c) => {
    const input = $f(c.dataset.counter);
    const max = Number(c.textContent.split('/')[1]);
    const upd = () => { c.textContent = `${formatNumber(input.value.length, 0)}/${formatNumber(max, 0)}`; c.classList.toggle('near', input.value.length > max * 0.9); };
    input.addEventListener('input', upd);
    upd();
  });

  const summary = $('#pf-summary', form);
  return function check() {
    const failed = controls.filter(([, ctl]) => !ctl.check().ok).map(([input]) => input);
    if (!failed.length) { summary.hidden = true; return true; }
    mount(summary, html`<b>Revisa ${failed.length === 1 ? 'un campo' : `${failed.length} campos`} antes de guardar</b>
      <ul>${failed.map((i) => html`<li><a href="#${i.id}" data-jump="${i.id}">${label(i.name)}</a>: ${form.querySelector(`#${i.id}-msg`)?.textContent || ''}</li>`)}</ul>`);
    summary.hidden = false;
    summary.querySelectorAll('[data-jump]').forEach((a) => { a.onclick = (e) => { e.preventDefault(); form.querySelector(`#${a.dataset.jump}`)?.focus(); }; });
    summary.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    failed[0].focus({ preventScroll: true });
    return false;
  };
}

export function readProjectForm(form) {
  const d = formData(form);
  const num = (v) => { const n = parseNumber(v); return n === null || Number.isNaN(n) ? null : n; };
  return {
    name: d.name.trim(), type: d.type, status: d.status, location: d.location.trim(), address: d.address.trim(), description: d.description,
    lotArea: num(d.lotArea), builtArea: num(d.builtArea), floors: d.floors ? Number(d.floors) : null, budgetEstimate: num(d.budgetEstimate),
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
  const form = $('#project-form', m.el);
  const check = wireProjectForm(form);
  form.elements.name.focus();
  const save = m.el.querySelector('[data-save]');
  const submit = () => {
    if (!check()) return;
    busy(save, async () => {
      const p = await api.post('/projects', readProjectForm(form));
      m.close();
      toast('Proyecto creado');
      location.hash = `#/projects/${p.id}`;
    });
  };
  save.onclick = submit;
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
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
      <a class="card project-card pc2 pc3" href="#/projects/${p.id}">
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
        <span class="pc2-glare" aria-hidden="true"></span>
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
  <div class="row wrap filter-bar" style="margin-bottom:18px">
    <label class="search" style="max-width:360px">${icon('search')}<input id="filter" placeholder="Filtrar por nombre, ubicación o código"></label>
    <div class="tabs" id="status-tabs">
      <button class="active" data-status="">Todos</button>
      ${Object.entries(STATUS_LABEL).map(([k, v]) => html`<button data-status="${k}">${v}</button>`)}
    </div>
  </div>
  <div class="grid g3" id="list"></div>`);

  const redraw = () => { draw(); tilt($('#list', el), '.pc3', 5); };
  redraw();
  $('#filter', el).addEventListener('input', (e) => { filter = e.target.value.toLowerCase().trim(); redraw(); });
  on(el, 'click', '[data-status]', (e, b) => {
    status = b.dataset.status;
    el.querySelectorAll('[data-status]').forEach((x) => x.classList.toggle('active', x === b));
    redraw();
  });
  on(el, 'click', '[data-new]', openCreate);
  if (query?.has('new')) openCreate();
}
