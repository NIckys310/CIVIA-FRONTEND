// Detalle de proyecto con pestañas.
import { api, downloadFile, downloadPath, fileUrl, upload } from '../api.js';
import {
  $, avatar, busy, confirmDialog, coverArt, fmtBytes, fmtDate, fmtMoney, fmtNum, formData, html, icon, KIND_LABEL, KIND_PLURAL,
  markdown, modal, mount, on, relTime, STATUS_LABEL, toast,
} from '../ui.js';
import { projectForm, readProjectForm, wireProjectForm } from './projects.js';

const TABS = [
  ['overview', 'Resumen', 'home'], ['files', 'Archivos', 'blueprint'], ['tasks', 'Tareas', 'tasks'],
  ['budget', 'Presupuesto', 'wallet'], ['spaces', 'Espacios', 'layers'], ['team', 'Equipo', 'users'], ['log', 'Bitácora', 'clock'],
];
const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.tif,.tiff,.dxf,.dwg,.glb,.gltf,.obj,.mtl,.stl,.fbx,.ifc,.skp,.rvt,.3dm,.docx,.xlsx,.pptx,.zip,.doc,.xls,.txt,.csv,.md';
const MODEL_VIEWABLE = ['glb', 'gltf', 'obj', 'stl'];

const kindIcon = (d) => {
  const cls = d.kind === 'PLAN' ? 'plan' : d.kind === 'MODEL_3D' ? 'model' : d.kind === 'PHOTO' ? 'photo' : '';
  return html`<div class="file-ico ${cls}">${d.extension}</div>`;
};

export async function render(el, { id, tab, query }) {
  mount(el, html`<div class="card skeleton" style="height:180px"></div>`);
  const project = await api.get(`/projects/${id}`);
  const canEdit = project.role !== 'VIEWER';

  mount(el, html`
  <a href="#/projects" class="btn ghost sm" style="margin:-8px 0 14px -8px">${icon('back')} Proyectos</a>
  <div class="card" style="overflow:hidden;margin-bottom:18px">
    <div class="cover" style="height:170px">${coverArt(project.id, project.coverColor)}</div>
    <div style="padding:0 26px 24px;margin-top:-34px;position:relative">
      <div class="row between wrap" style="align-items:flex-end;gap:18px">
        <div>
          <div class="row"><span class="pill gold">${STATUS_LABEL[project.status]}</span><span class="mono faint">${project.code || ''}</span></div>
          <h1 style="margin-top:12px">${project.name}</h1>
          <div class="row wrap faint" style="margin-top:8px;font-size:13px;gap:16px">
            <span class="row" style="gap:6px">${icon('building')}${project.type || 'Proyecto'}</span>
            ${project.location ? html`<span class="row" style="gap:6px">${icon('pin')}${project.location}</span>` : ''}
            ${project.builtArea ? html`<span class="row" style="gap:6px">${icon('ruler')}${fmtNum(project.builtArea, 0)} m²</span>` : ''}
            ${project.floors ? html`<span class="row" style="gap:6px">${icon('layers')}${project.floors} pisos</span>` : ''}
          </div>
        </div>
        <div class="row wrap">
          <a class="btn" href="#/copilot?project=${project.id}">${icon('sparkle')} Preguntar a CIVIA</a>
          <a class="btn" href="#/camera/${project.id}">${icon('camera')} Cámara</a>
          ${canEdit ? html`<button class="btn" id="edit-project">${icon('edit')} Editar</button>` : ''}
        </div>
      </div>
      <div class="stepper" id="phases" style="margin-top:24px"></div>
    </div>
  </div>
  <div class="tabs" style="margin-bottom:18px" role="tablist">
    ${TABS.map(([k, label, ic]) => html`<a href="#/projects/${id}/${k}" class="${k === tab ? 'active' : ''}" role="tab">${icon(ic)}${label}</a>`)}
  </div>
  <div id="tab"></div>`);

  loadPhases(el, project, canEdit);
  $('#edit-project', el)?.addEventListener('click', () => editProject(project));
  const target = $('#tab', el);
  const views = { overview, files, tasks, budget, spaces, team, log };
  return (views[tab] || overview)(target, project, canEdit, query);
}

async function loadPhases(el, project, canEdit) {
  const phases = await api.get(`/projects/${project.id}/phases`);
  const currentIndex = Math.max(0, phases.findIndex((f) => f.status === 'EN_CURSO'));
  mount($('#phases', el), html`${phases.map((f, i) => html`
    <div class="step ${i < currentIndex || f.status === 'TERMINADA' ? 'done' : ''} ${i === currentIndex ? 'current' : ''}" data-phase="${f.id}" title="${canEdit ? 'Marcar como fase actual' : ''}">
      <i></i><span>${f.name}</span></div>`)}`);
  if (!canEdit) return;
  on($('#phases', el), 'click', '[data-phase]', async (e, step) => {
    const idx = phases.findIndex((f) => f.id === step.dataset.phase);
    await Promise.all(phases.map((f, i) => api.patch(`/projects/${project.id}/phases/${f.id}`, {
      status: i < idx ? 'TERMINADA' : i === idx ? 'EN_CURSO' : 'PENDIENTE',
    })));
    toast(`Fase actual: ${phases[idx].name}`);
    loadPhases(el, project, canEdit);
  });
}

function editProject(project) {
  const m = modal({
    title: 'Editar proyecto', wide: true, body: projectForm(project),
    foot: html`<button class="btn ghost danger" data-archive>${icon('trash')} Archivar</button><span class="right"></span>
      <button class="btn ghost" data-cancel>Cancelar</button><button class="btn primary" data-save data-busy="Guardando…">Guardar</button>`,
  });
  m.el.querySelector('[data-cancel]').onclick = m.close;
  const check = wireProjectForm($('#project-form', m.el));
  m.el.querySelector('[data-save]').onclick = (e) => check() && busy(e.currentTarget, async () => {
    await api.patch(`/projects/${project.id}`, readProjectForm($('#project-form', m.el)));
    m.close();
    toast('Proyecto actualizado');
    location.reload();
  });
  m.el.querySelector('[data-archive]').onclick = async () => {
    if (await confirmDialog('Archivar proyecto', 'El proyecto dejará de aparecer en tu lista. Solo el propietario puede archivarlo.', 'Archivar', true)) {
      await api.del(`/projects/${project.id}`);
      m.close();
      location.hash = '#/projects';
    }
  };
}

// ------------------------------------------------------------------ resumen

async function overview(el, project) {
  mount(el, html`<div class="split"><div class="card skeleton" style="height:320px"></div><div class="card skeleton" style="height:320px"></div></div>`);
  const [recs, analyses] = await Promise.all([
    api.get(`/ai/projects/${project.id}/recommendations`),
    api.get(`/ai/projects/${project.id}/analyses`),
  ]);
  const s = project.stats;
  const actionLink = (a) => {
    if (!a) return '';
    if (a.startsWith('library:')) return `#/library/a/${a.slice(8)}`;
    return {
      'upload-plan': `#/projects/${project.id}/files`, analyze: `#/projects/${project.id}/files`, 'open-3d': `#/projects/${project.id}/files`,
      'open-camera': `#/camera/${project.id}`, 'open-budget': `#/projects/${project.id}/budget`, 'open-tasks': `#/projects/${project.id}/tasks`,
      'open-members': `#/projects/${project.id}/team`,
    }[a] || '';
  };
  const score = Math.max(0, Math.min(100, 100 - recs.filter((r) => r.priority === 'alta').length * 18 - recs.filter((r) => r.priority === 'media').length * 7));

  mount(el, html`
  <div class="split">
    <div class="stack lg">
      <div class="card glow">
        <div class="card-head">
          <div><div class="eyebrow gold">CIVIA · revisión del proyecto</div><h3 style="margin-top:8px">Lo que hace falta</h3></div>
          <div class="ring" style="--p:${score}"><span>${score}</span></div>
        </div>
        <div class="card-body" style="padding-top:4px">
          ${recs.length ? recs.map((r) => html`<div class="rec ${r.priority}">
              <div class="mark">${icon(r.priority === 'alta' ? 'alert' : r.priority === 'media' ? 'info' : 'sparkle')}</div>
              <div><h4>${r.title}</h4><p>${r.detail}</p></div>
              ${actionLink(r.action) ? html`<a class="btn sm" href="${actionLink(r.action)}">${icon('arrow')}</a>` : ''}
            </div>`)
          : html`<div class="empty">${icon('check', 'big')}<h3>Todo en orden</h3><p>CIVIA no encontró pendientes importantes.</p></div>`}
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Análisis de IA recientes</h3><a class="btn sm ghost" href="#/projects/${project.id}/files">Archivos ${icon('arrow')}</a></div>
        <div class="card-body" style="padding-top:6px">
          ${analyses.length ? analyses.slice(0, 6).map((a) => html`<div class="file-row" data-analysis="${a.id}">
              <div class="file-ico ${a.analysisType === 'MODEL' ? 'model' : 'plan'}">${a.analysisType === 'MODEL' ? '3D' : 'PLN'}</div>
              <div style="min-width:0"><div class="name">${a.documentName || 'Archivo eliminado'}</div><div class="sub">${a.summary || ''}</div></div>
              <div class="row">${a.completeness != null ? html`<span class="pill ${a.completeness >= 75 ? 'ok' : a.completeness >= 45 ? 'warn' : 'danger'}">${a.completeness} %</span>` : ''}<span class="hint">${relTime(a.createdAt)}</span></div>
            </div>`)
          : html`<p class="faint" style="padding:12px 0">Sube un plano y pulsa «Analizar con IA» para ver aquí la revisión.</p>`}
        </div>
      </div>
    </div>
    <div class="stack lg">
      <div class="grid g2">
        ${[['Planos', s.plans, 'blueprint'], ['Modelos 3D', s.models, 'cube'], ['Fotos', s.photos, 'camera'], ['Tareas abiertas', s.openTasks, 'tasks']]
          .map(([l, v, ic]) => html`<div class="card kpi"><div class="eyebrow">${l}</div><div class="ico">${icon(ic)}</div><div class="val">${v}</div></div>`)}
      </div>
      <div class="card">
        <div class="card-head"><h3>Ficha</h3></div>
        <div class="card-body">
          <table class="table"><tbody>
            ${[['Propietario', project.ownerName], ['Fase', project.phase], ['Área del lote', project.lotArea ? `${fmtNum(project.lotArea)} m²` : '—'],
              ['Área construida', project.builtArea ? `${fmtNum(project.builtArea)} m²` : '—'], ['Presupuesto estimado', project.budgetEstimate ? fmtMoney(project.budgetEstimate, project.currency) : '—'],
              ['Inicio', fmtDate(project.startDate)], ['Entrega', fmtDate(project.dueDate)], ['Creado', fmtDate(project.createdAt)]]
              .map(([k, v]) => html`<tr><td class="faint">${k}</td><td style="text-align:right">${v || '—'}</td></tr>`)}
          </tbody></table>
          ${project.description ? html`<div class="sep"></div><div class="md">${markdown(project.description)}</div>` : ''}
        </div>
      </div>
      <a class="card hover pad row" href="#/massing/${project.id}" style="gap:16px">
        <div class="kpi" style="padding:0"><div class="ico" style="position:static">${icon('cube')}</div></div>
        <div><h3>Volumetría con IA</h3><p class="muted" style="font-size:13px;margin-top:4px">Genera la masa máxima del lote según índices y retiros, en 3D.</p></div>
        <span class="right">${icon('chevron')}</span>
      </a>
    </div>
  </div>`);
  on(el, 'click', '[data-analysis]', (e, row) => {
    const a = analyses.find((x) => x.id === row.dataset.analysis);
    if (a) showAnalysis(a, project);
  });
}

// ------------------------------------------------------------------ análisis

export function showAnalysis(a, project, onChange) {
  const r = a.result || {};
  const isPlan = a.analysisType === 'PLAN';
  const checks = r.checks || [];
  const stIcon = (s) => icon(s === 'OK' ? 'check' : s === 'FALTA' ? 'x' : 'alert');
  const metrics = Object.entries(r.metrics || {}).filter(([, v]) => typeof v !== 'object');
  const m = modal({
    title: a.documentName || 'Análisis',
    eyebrow: `${isPlan ? 'Revisión de plano' : 'Revisión de modelo 3D'} · ${a.engine}`,
    wide: true,
    body: html`
      <div class="row" style="gap:18px;align-items:flex-start;margin-bottom:18px">
        ${a.completeness != null ? html`<div class="ring" style="--p:${a.completeness}"><span>${a.completeness}</span></div>` : ''}
        <div><p>${a.summary}</p>
          ${r.documentType ? html`<div class="row wrap" style="margin-top:10px"><span class="pill gold">Tipo: ${r.documentType}</span>
            ${(r.detectedElements || r.detectedComponents || []).slice(0, 12).map((x) => html`<span class="pill">${x}</span>`)}</div>` : ''}
          ${!r.documentType && (r.detectedComponents || []).length ? html`<div class="row wrap" style="margin-top:10px">${r.detectedComponents.map((x) => html`<span class="pill">${x}</span>`)}</div>` : ''}
        </div>
      </div>
      ${(r.warnings || []).map((w) => html`<div class="check-item REVISAR" style="margin-bottom:8px"><div class="st">${icon('info')}</div><div><p style="margin:0">${w}</p></div><span></span></div>`)}
      ${checks.length ? html`<div class="eyebrow" style="margin:18px 0 10px">Verificaciones</div><div class="check-list">
        ${checks.map((c) => html`<div class="check-item ${c.status}" data-check="${c.id}">
          <div class="st">${stIcon(c.status)}</div>
          <div><h4>${c.title}</h4><p>${c.detail}</p>${c.recommendation ? html`<p style="color:var(--text)">→ ${c.recommendation}</p>` : ''}</div>
          ${c.status !== 'OK' && project?.role !== 'VIEWER' ? html`<label class="check" title="Marcar como resuelto"><input type="checkbox" data-resolve="${c.id}"> Resuelto</label>` : html`<span></span>`}
        </div>`)}</div>` : ''}
      ${(r.recommendations || []).length ? html`<div class="eyebrow" style="margin:22px 0 4px">Recomendaciones</div>
        ${r.recommendations.map((x) => html`<div class="rec ${x.priority}"><div class="mark">${icon(x.priority === 'alta' ? 'alert' : 'sparkle')}</div><div><h4>${x.title}</h4><p>${x.detail}</p></div>
          ${x.action?.startsWith('library:') ? html`<a class="btn sm ghost" href="#/library/a/${x.action.slice(8)}">${icon('book')}</a>` : html`<span></span>`}</div>`)}` : ''}
      ${metrics.length ? html`<div class="eyebrow" style="margin:22px 0 8px">Métricas</div><div class="row wrap">${metrics.map(([k, v]) => html`<span class="pill">${k}: ${String(v)}</span>`)}</div>` : ''}
      <p class="hint" style="margin-top:22px">Requiere revisión y aprobación del profesional responsable.</p>`,
  });
  on(m.el, 'change', '[data-resolve]', async (e, input) => {
    await api.patch(`/ai/analyses/${a.id}/findings/${input.dataset.resolve}`, { resolved: input.checked });
    input.closest('.check-item').classList.toggle('resolved', input.checked);
    onChange?.();
  });
}

// ------------------------------------------------------------------ archivos

async function files(el, project, canEdit) {
  let docs = await api.get(`/projects/${project.id}/documents`);
  let kind = '';
  const uploads = [];

  const draw = () => {
    const list = docs.filter((d) => !kind || d.kind === kind);
    mount($('#doc-list', el), list.length ? html`${list.map((d) => html`
      <div class="file-row" data-doc="${d.id}">
        ${kindIcon(d)}
        <div style="min-width:0">
          <div class="name">${d.name}</div>
          <div class="sub">${KIND_LABEL[d.kind]}${d.planType ? ` · ${d.planType}` : ''} · ${fmtBytes(d.sizeBytes)} · v${d.version} · ${d.uploadedBy || ''} · ${relTime(d.createdAt)}</div>
        </div>
        <div class="row">
          ${d.lastAnalysis ? html`<span class="pill ${d.lastAnalysis.completeness >= 75 ? 'ok' : d.lastAnalysis.completeness >= 45 ? 'warn' : 'danger'}" title="Último análisis">${icon('sparkle')} ${d.lastAnalysis.completeness ?? '✓'}${d.lastAnalysis.completeness != null ? ' %' : ''}</span>` : ''}
          ${d.kind === 'MODEL_3D' && MODEL_VIEWABLE.includes(d.extension) ? html`<a class="btn sm" href="#/viewer/${d.id}" data-stop>${icon('cube')} Ver 3D</a>` : ''}
          ${d.kind !== 'MODEL_3D' && canEdit ? html`<button class="btn sm" data-analyze="${d.id}" data-stop data-busy="Analizando…">${icon('sparkle')} Analizar con IA</button>` : ''}
          <button class="btn sm ghost icon" data-download="${d.id}" data-stop title="Descargar">${icon('download')}</button>
        </div>
      </div>`)}`
      : html`<div class="empty">${icon('blueprint', 'big')}<h3>Sin archivos${kind ? ' de este tipo' : ''}</h3><p>Sube planos arquitectónicos (PDF, DWG, DXF, imágenes), modelos 3D (GLB, OBJ, STL, FBX, IFC…) y documentos.</p></div>`);
  };

  mount(el, html`
  <div class="split">
    <div class="card">
      <div class="card-head">
        <div class="tabs" id="kind-tabs">
          <button class="active" data-kind="">Todos</button>
          ${Object.entries(KIND_PLURAL).map(([k, v]) => html`<button data-kind="${k}">${v}</button>`)}
        </div>
      </div>
      <div class="card-body" id="doc-list" style="padding:10px"></div>
    </div>
    <div class="stack lg">
      ${canEdit ? html`<div class="card pad">
        <div class="eyebrow gold" style="margin-bottom:14px">Subir archivos</div>
        <div class="field" style="margin-bottom:12px"><label>Tipo de archivo</label>
          <select class="input" id="up-kind"><option value="">Detectar automáticamente</option>${Object.entries(KIND_LABEL).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select></div>
        <div class="field" style="margin-bottom:14px"><label>Tipo de plano (opcional)</label>
          <select class="input" id="up-plan"><option value="">—</option>${['planta', 'corte', 'fachada', 'localización', 'cubierta', 'estructural', 'eléctrico', 'hidrosanitario', 'detalle'].map((t) => html`<option>${t}</option>`)}</select></div>
        <label class="dropzone" id="drop">
          ${icon('upload')}
          <div><b>Arrastra archivos aquí</b><div class="hint" style="margin-top:4px">o haz clic para elegir · planos, modelos 3D, fotos y documentos</div></div>
          <input type="file" id="file-input" multiple accept="${ACCEPT}" hidden>
        </label>
        <div id="uploads"></div>
      </div>` : ''}
      <div class="card pad">
        <div class="eyebrow" style="margin-bottom:10px">Formatos</div>
        <p class="muted" style="font-size:13px">Planos: PDF, DWG, DXF, PNG, JPG, TIFF · 3D: GLB, glTF, OBJ, STL, FBX, IFC, SKP, RVT · Documentos: Word, Excel, PowerPoint, ZIP, CSV.</p>
        <p class="hint" style="margin-top:10px">Los archivos se guardan con nombre aleatorio, se verifica su firma real y solo los ven los miembros del proyecto.</p>
      </div>
    </div>
  </div>`);
  draw();

  on(el, 'click', '[data-kind]', (e, b) => {
    kind = b.dataset.kind;
    el.querySelectorAll('[data-kind]').forEach((x) => x.classList.toggle('active', x === b));
    draw();
  });
  on(el, 'click', '[data-download]', (e, b) => {
    const d = docs.find((x) => x.id === b.dataset.download);
    downloadFile(d.id, d.name);
  });
  on(el, 'click', '[data-analyze]', async (e, b) => {
    const result = await busy(b, () => api.post(`/ai/documents/${b.dataset.analyze}/analyze`, {}));
    toast('Análisis listo');
    docs = await api.get(`/projects/${project.id}/documents`);
    draw();
    showAnalysis(result, project);
  });
  on(el, 'click', '[data-doc]', (e, row) => {
    if (e.target.closest('[data-stop]')) return;
    openDocument(docs.find((d) => d.id === row.dataset.doc), project, canEdit, async () => {
      docs = await api.get(`/projects/${project.id}/documents`);
      draw();
    });
  });

  if (!canEdit) return;
  const drop = $('#drop', el);
  const input = $('#file-input', el);
  drop.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
  ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => send([...e.dataTransfer.files]));
  input.addEventListener('change', () => { send([...input.files]); input.value = ''; });

  async function send(fileList) {
    for (const file of fileList) {
      const item = { name: file.name, progress: 0, status: 'Subiendo…' };
      uploads.unshift(item);
      drawUploads();
      try {
        await upload(`/projects/${project.id}/documents`, file, { kind: $('#up-kind', el).value, planType: $('#up-plan', el).value }, (p) => {
          item.progress = p;
          drawUploads();
        });
        item.progress = 1;
        item.status = 'Listo';
      } catch (err) {
        item.status = err.message;
        item.error = true;
      }
      drawUploads();
    }
    docs = await api.get(`/projects/${project.id}/documents`);
    draw();
  }
  function drawUploads() {
    mount($('#uploads', el), html`${uploads.slice(0, 6).map((u) => html`<div class="upload-item">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${u.name}</span>
      <span class="${u.error ? 'error-text' : 'hint'}">${u.status === 'Subiendo…' ? `${Math.round(u.progress * 100)} %` : u.status}</span>
      <div class="progress"><i style="width:${Math.round(u.progress * 100)}%"></i></div></div>`)}`);
  }
}

async function openDocument(d, project, canEdit, onChange) {
  const previewable = d.mediaType.startsWith('image/') || d.mediaType === 'application/pdf';
  const m = modal({
    title: d.name,
    eyebrow: `${KIND_LABEL[d.kind]} · ${fmtBytes(d.sizeBytes)} · versión ${d.version}`,
    wide: true,
    body: html`
      <div class="preview" id="pv">${previewable ? html`<div class="spinner"></div>` : html`<div class="empty">${kindIcon(d)}<p>Vista previa no disponible para .${d.extension}. Puedes descargarlo.</p></div>`}</div>
      <div class="grid g2" style="margin-top:18px">
        <div class="stack">
          <div class="field"><label>Descripción</label><textarea class="input" id="doc-desc" ${canEdit ? '' : 'disabled'}>${d.description || ''}</textarea></div>
          <div class="form-grid">
            <div class="field"><label>Tipo de plano</label><input class="input" id="doc-type" value="${d.planType || ''}" ${canEdit ? '' : 'disabled'}></div>
            <div class="field"><label>Escala</label><input class="input" id="doc-scale" value="${d.scale || ''}" placeholder="1:100" ${canEdit ? '' : 'disabled'}></div>
          </div>
        </div>
        <div class="stack">
          <div class="field"><label>Comentarios</label><div id="doc-comments" class="stack" style="max-height:180px;overflow:auto"></div></div>
          <form class="row" id="doc-comment"><input class="input" name="body" placeholder="Escribe un comentario…"><button class="btn">${icon('send')}</button></form>
          <div class="hint mono">SHA-256 ${d.sha256 ? d.sha256.slice(0, 16) : ''}…</div>
        </div>
      </div>`,
    foot: html`${canEdit ? html`<button class="btn ghost danger" data-del>${icon('trash')} Eliminar</button>
        <label class="btn ghost">${icon('upload')} Nueva versión<input type="file" hidden data-version accept=".${d.extension}"></label>` : ''}
      <span class="right"></span>
      <button class="btn" data-dl>${icon('download')} Descargar</button>
      ${d.kind === 'MODEL_3D' ? html`<a class="btn primary" href="#/viewer/${d.id}">${icon('cube')} Abrir en 3D</a>`
        : canEdit ? html`<button class="btn primary" data-an data-busy="Analizando…">${icon('sparkle')} Analizar con IA</button>` : ''}
      ${canEdit ? html`<button class="btn" data-save>Guardar</button>` : ''}`,
  });
  m.el.querySelector('a[href^="#/viewer"]')?.addEventListener('click', m.close);

  if (previewable) {
    fileUrl(d.id, d).then((url) => {
      mount($('#pv', m.el), d.mediaType === 'application/pdf'
        ? html`<iframe src="${url}" title="${d.name}"></iframe>` : html`<img src="${url}" alt="${d.name}">`);
    }).catch((e) => mount($('#pv', m.el), html`<p class="error-text">${e.message}</p>`));
  }
  const loadComments = async () => {
    const list = await api.get(`/projects/${project.id}/comments?targetId=${d.id}`);
    mount($('#doc-comments', m.el), list.length ? html`${list.map((c) => html`<div class="row" style="align-items:flex-start">${avatar(c.authorName, c.authorColor)}
      <div><div style="font-size:13px"><b>${c.authorName}</b> <span class="hint">${relTime(c.createdAt)}</span></div><div style="font-size:13px">${c.body}</div></div></div>`)}`
      : html`<span class="hint">Sin comentarios.</span>`);
  };
  loadComments();
  $('#doc-comment', m.el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = e.target.body.value.trim();
    if (!body) return;
    await api.post(`/projects/${project.id}/comments`, { body, targetType: 'document', targetId: d.id });
    e.target.reset();
    loadComments();
  });
  m.el.querySelector('[data-dl]').onclick = () => downloadFile(d.id, d.name);
  m.el.querySelector('[data-save]')?.addEventListener('click', async () => {
    await api.patch(`/documents/${d.id}`, { description: $('#doc-desc', m.el).value, planType: $('#doc-type', m.el).value, scale: $('#doc-scale', m.el).value });
    toast('Archivo actualizado');
    onChange();
  });
  m.el.querySelector('[data-an]')?.addEventListener('click', async (e) => {
    const result = await busy(e.currentTarget, () => api.post(`/ai/documents/${d.id}/analyze`, {}));
    m.close();
    onChange();
    showAnalysis(result, project);
  });
  m.el.querySelector('[data-version]')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await upload(`/documents/${d.id}/versions`, file, {});
    toast('Nueva versión subida');
    m.close();
    onChange();
  });
  m.el.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (await confirmDialog('Eliminar archivo', `Se eliminará «${d.name}» con todas sus versiones.`, 'Eliminar', true)) {
      await api.del(`/documents/${d.id}`);
      m.close();
      toast('Archivo eliminado');
      onChange();
    }
  });
}

// ------------------------------------------------------------------ tareas (kanban)

async function tasks(el, project, canEdit) {
  const [list, members, phases] = await Promise.all([
    api.get(`/projects/${project.id}/tasks`), api.get(`/projects/${project.id}/members`), api.get(`/projects/${project.id}/phases`),
  ]);
  const COLS = [['TODO', 'Por hacer'], ['IN_PROGRESS', 'En curso'], ['REVIEW', 'En revisión'], ['DONE', 'Terminado']];
  const PRIO = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', URGENT: 'Urgente' };

  const draw = () => mount(el, html`
    <div class="row between" style="margin-bottom:14px"><p class="muted">${list.filter((t) => t.status !== 'DONE').length} tareas abiertas · arrastra las tarjetas entre columnas.</p>
      ${canEdit ? html`<button class="btn primary" data-new-task>${icon('plus')} Nueva tarea</button>` : ''}</div>
    <div class="kanban">${COLS.map(([k, label]) => html`<div class="col" data-col="${k}">
      <div class="col-head"><span class="eyebrow">${label}</span><span class="pill">${list.filter((t) => t.status === k).length}</span></div>
      ${list.filter((t) => t.status === k).map((t) => html`<div class="task" draggable="${canEdit}" data-task="${t.id}">
        <h4>${t.title}</h4>
        ${t.description ? html`<p class="hint" style="margin-top:4px">${t.description.length > 90 ? `${t.description.slice(0, 90)}…` : t.description}</p>` : ''}
        <div class="row"><span class="prio-${t.priority}">● ${PRIO[t.priority]}</span>${t.dueDate ? html`<span>${icon('clock')}</span><span>${fmtDate(t.dueDate)}</span>` : ''}
          <span class="right">${t.assigneeName || ''}</span></div>
      </div>`)}</div>`)}</div>`);
  draw();

  const taskForm = (t = {}) => html`<form id="task-form" class="form-grid">
    <div class="field full"><label>Título</label><input class="input" name="title" required value="${t.title || ''}"></div>
    <div class="field full"><label>Descripción</label><textarea class="input" name="description">${t.description || ''}</textarea></div>
    <div class="field"><label>Prioridad</label><select class="input" name="priority">${Object.entries(PRIO).map(([k, v]) => html`<option value="${k}" ${(t.priority || 'MEDIUM') === k ? 'selected' : ''}>${v}</option>`)}</select></div>
    <div class="field"><label>Estado</label><select class="input" name="status">${COLS.map(([k, v]) => html`<option value="${k}" ${(t.status || 'TODO') === k ? 'selected' : ''}>${v}</option>`)}</select></div>
    <div class="field"><label>Responsable</label><select class="input" name="assigneeId"><option value="">—</option>${members.map((m) => html`<option value="${m.userId}" ${t.assigneeId === m.userId ? 'selected' : ''}>${m.fullName}</option>`)}</select></div>
    <div class="field"><label>Fase</label><select class="input" name="phaseId"><option value="">—</option>${phases.map((f) => html`<option value="${f.id}" ${t.phaseId === f.id ? 'selected' : ''}>${f.name}</option>`)}</select></div>
    <div class="field"><label>Fecha límite</label><input class="input" type="date" name="dueDate" value="${t.dueDate || ''}"></div>
  </form>`;

  const openTask = (t) => {
    const m = modal({
      title: t ? 'Editar tarea' : 'Nueva tarea', body: taskForm(t),
      foot: html`${t && canEdit ? html`<button class="btn ghost danger" data-del>${icon('trash')}</button>` : ''}<span class="right"></span>
        <button class="btn ghost" data-cancel>Cancelar</button>${canEdit ? html`<button class="btn primary" data-save>Guardar</button>` : ''}`,
    });
    m.el.querySelector('[data-cancel]').onclick = m.close;
    m.el.querySelector('[data-save]')?.addEventListener('click', async () => {
      const d = formData($('#task-form', m.el));
      if (!d.title.trim()) return;
      const body = { ...d, assigneeId: d.assigneeId || null, phaseId: d.phaseId || null, dueDate: d.dueDate || null };
      const saved = t ? await api.patch(`/projects/${project.id}/tasks/${t.id}`, body) : await api.post(`/projects/${project.id}/tasks`, body);
      const i = list.findIndex((x) => x.id === saved.id);
      if (i >= 0) list[i] = saved; else list.unshift(saved);
      m.close();
      draw();
    });
    m.el.querySelector('[data-del]')?.addEventListener('click', async () => {
      await api.del(`/projects/${project.id}/tasks/${t.id}`);
      list.splice(list.findIndex((x) => x.id === t.id), 1);
      m.close();
      draw();
    });
  };

  on(el, 'click', '[data-new-task]', () => openTask());
  on(el, 'click', '[data-task]', (e, card) => openTask(list.find((t) => t.id === card.dataset.task)));
  if (!canEdit) return;
  let dragged = null;
  el.addEventListener('dragstart', (e) => { const c = e.target.closest('[data-task]'); if (c) { dragged = c.dataset.task; c.classList.add('dragging'); } });
  el.addEventListener('dragend', (e) => e.target.closest?.('[data-task]')?.classList.remove('dragging'));
  el.addEventListener('dragover', (e) => { const col = e.target.closest('[data-col]'); if (col) { e.preventDefault(); col.classList.add('over'); } });
  el.addEventListener('dragleave', (e) => e.target.closest?.('[data-col]')?.classList.remove('over'));
  el.addEventListener('drop', async (e) => {
    const col = e.target.closest('[data-col]');
    if (!col || !dragged) return;
    e.preventDefault();
    const t = list.find((x) => x.id === dragged);
    dragged = null;
    if (t.status === col.dataset.col) { draw(); return; }
    t.status = col.dataset.col;
    draw();
    Object.assign(t, await api.patch(`/projects/${project.id}/tasks/${t.id}`, { status: t.status }));
  });
}

// ------------------------------------------------------------------ presupuesto

async function budget(el, project, canEdit) {
  let b = await api.get(`/projects/${project.id}/budget`);
  const cur = b.currency || 'COP';
  const draw = () => mount(el, html`
  <div class="split">
    <div class="card">
      <div class="card-head"><h3>Capítulos e ítems</h3>
        <div class="row">${canEdit && !b.chapters.length ? html`<button class="btn sm" data-template>${icon('clipboard')} Usar plantilla</button>` : ''}
          ${canEdit ? html`<button class="btn sm primary" data-chapter>${icon('plus')} Capítulo</button>` : ''}
          <button class="btn sm ghost" data-export>${icon('download')} CSV</button></div></div>
      ${b.chapters.length ? html`<div class="table-wrap"><table class="table">
        <thead><tr><th>Código</th><th>Descripción</th><th>Und</th><th class="num">Cantidad</th><th class="num">V. unitario</th><th class="num">Total</th><th></th></tr></thead>
        <tbody>${b.chapters.map((c) => html`
          <tr style="background:var(--glass)"><td class="mono">${c.code}</td><td colspan="4"><b>${c.name}</b></td><td class="num"><b>${fmtMoney(c.subtotal, cur)}</b></td>
            <td style="white-space:nowrap">${canEdit ? html`<button class="btn sm ghost icon" data-item="${c.id}" title="Agregar ítem">${icon('plus')}</button><button class="btn sm ghost icon" data-del-chapter="${c.id}" title="Eliminar capítulo">${icon('trash')}</button>` : ''}</td></tr>
          ${c.items.map((i) => html`<tr><td class="mono faint">${i.code || ''}</td><td>${i.description}</td><td>${i.unit}</td>
            <td class="num">${fmtNum(i.quantity, 3)}</td><td class="num">${fmtMoney(i.unitPrice, cur)}</td><td class="num">${fmtMoney(i.total, cur)}</td>
            <td>${canEdit ? html`<button class="btn sm ghost icon" data-edit-item="${i.id}">${icon('edit')}</button>` : ''}</td></tr>`)}`)}
        </tbody></table></div>`
      : html`<div class="empty">${icon('wallet', 'big')}<h3>Presupuesto vacío</h3><p>Empieza con la plantilla de capítulos típicos de una edificación o crea los tuyos.</p></div>`}
    </div>
    <div class="stack lg">
      <div class="card glow pad">
        <div class="eyebrow gold">Valor total</div>
        <div class="display" style="font-size:36px;margin-top:12px">${fmtMoney(b.total, cur)}</div>
        ${b.costPerM2 ? html`<div class="hint" style="margin-top:6px">${fmtMoney(b.costPerM2, cur)} por m² construido</div>` : ''}
        <div class="sep"></div>
        <table class="table"><tbody>
          ${[['Costo directo', b.directCost], [`Administración (${b.settings.administrationPct} %)`, b.administration], [`Imprevistos (${b.settings.contingencyPct} %)`, b.contingency],
            [`Utilidad (${b.settings.profitPct} %)`, b.profit], [`IVA sobre utilidad (${b.settings.taxOnProfitPct} %)`, b.taxOnProfit]]
            .map(([k, v]) => html`<tr><td class="faint">${k}</td><td class="num">${fmtMoney(v, cur)}</td></tr>`)}
        </tbody></table>
      </div>
      ${canEdit ? html`<form class="card pad" id="aiu"><div class="eyebrow" style="margin-bottom:14px">AIU</div>
        <div class="form-grid">
          ${[['administrationPct', 'Administración %'], ['contingencyPct', 'Imprevistos %'], ['profitPct', 'Utilidad %'], ['taxOnProfitPct', 'IVA s/ utilidad %']]
            .map(([k, l]) => html`<div class="field"><label>${l}</label><input class="input" type="number" step="any" min="0" name="${k}" value="${b.settings[k]}"></div>`)}
        </div><button class="btn block" style="margin-top:14px">Actualizar</button></form>` : ''}
    </div>
  </div>`);
  draw();

  const base = `/projects/${project.id}/budget`;
  on(el, 'click', '[data-template]', async () => { b = await api.post(`${base}/template`); draw(); });
  on(el, 'click', '[data-export]', () => downloadPath(`${base}/export.csv`, `presupuesto-${project.code || 'proyecto'}.csv`));
  on(el, 'click', '[data-chapter]', () => {
    const m = modal({ title: 'Nuevo capítulo', body: html`<div class="field"><label>Nombre</label><input class="input" id="ch-name" placeholder="Estructura"></div>`,
      foot: html`<button class="btn primary" data-ok>Agregar</button>` });
    m.el.querySelector('[data-ok]').onclick = async () => { b = await api.post(`${base}/chapters`, { name: $('#ch-name', m.el).value }); m.close(); draw(); };
  });
  on(el, 'click', '[data-del-chapter]', async (e, btn) => {
    if (await confirmDialog('Eliminar capítulo', 'Se eliminarán también sus ítems.', 'Eliminar', true)) { b = await api.del(`${base}/chapters/${btn.dataset.delChapter}`); draw(); }
  });
  const itemModal = (chapterId, item) => {
    const m = modal({
      title: item ? 'Editar ítem' : 'Nuevo ítem',
      body: html`<form id="item-form" class="form-grid">
        <div class="field"><label>Código</label><input class="input" name="code" value="${item?.code || ''}"></div>
        <div class="field"><label>Unidad</label><select class="input" name="unit">${['und', 'm', 'm2', 'm3', 'ml', 'kg', 'gl', 'día', 'mes'].map((u) => html`<option ${item?.unit === u ? 'selected' : ''}>${u}</option>`)}</select></div>
        <div class="field full"><label>Descripción</label><input class="input" name="description" required value="${item?.description || ''}"></div>
        <div class="field"><label>Cantidad</label><input class="input" type="number" step="any" min="0" name="quantity" value="${item?.quantity ?? ''}"></div>
        <div class="field"><label>Valor unitario</label><input class="input" type="number" step="any" min="0" name="unitPrice" value="${item?.unitPrice ?? ''}"></div>
      </form>`,
      foot: html`${item ? html`<button class="btn ghost danger" data-del>${icon('trash')}</button>` : ''}<span class="right"></span><button class="btn primary" data-ok>Guardar</button>`,
    });
    m.el.querySelector('[data-ok]').onclick = async () => {
      const d = formData($('#item-form', m.el));
      const body = { chapterId, code: d.code, unit: d.unit, description: d.description, quantity: d.quantity || 0, unitPrice: d.unitPrice || 0 };
      b = item ? await api.patch(`${base}/items/${item.id}`, body) : await api.post(`${base}/items`, body);
      m.close();
      draw();
    };
    m.el.querySelector('[data-del]')?.addEventListener('click', async () => { b = await api.del(`${base}/items/${item.id}`); m.close(); draw(); });
  };
  on(el, 'click', '[data-item]', (e, btn) => itemModal(btn.dataset.item));
  on(el, 'click', '[data-edit-item]', (e, btn) => {
    const item = b.chapters.flatMap((c) => c.items).find((i) => i.id === btn.dataset.editItem);
    itemModal(item.chapterId, item);
  });
  el.addEventListener('submit', async (e) => {
    if (e.target.id !== 'aiu') return;
    e.preventDefault();
    b = await api.put(`${base}/settings`, formData(e.target));
    toast('AIU actualizado');
    draw();
  });
}

// ------------------------------------------------------------------ espacios

async function spaces(el, project, canEdit) {
  let [levels, rooms] = await Promise.all([api.get(`/projects/${project.id}/levels`), api.get(`/projects/${project.id}/rooms`)]);
  const draw = () => {
    const total = rooms.reduce((s, r) => s + (r.area || 0), 0);
    mount(el, html`<div class="split">
      <div class="card"><div class="card-head"><h3>Programa arquitectónico</h3><span class="pill gold">${fmtNum(total)} m²</span></div>
        ${rooms.length ? html`<div class="table-wrap"><table class="table"><thead><tr><th>Espacio</th><th>Tipo</th><th>Nivel</th><th class="num">Área</th><th></th></tr></thead>
          <tbody>${rooms.map((r) => html`<tr><td>${r.name}</td><td class="faint">${r.roomType || ''}</td><td>${r.levelName || '—'}</td><td class="num">${r.area != null ? `${fmtNum(r.area)} m²` : '—'}</td>
          <td>${canEdit ? html`<button class="btn sm ghost icon" data-del-room="${r.id}">${icon('trash')}</button>` : ''}</td></tr>`)}</tbody></table></div>`
        : html`<div class="empty">${icon('layers', 'big')}<p>Registra los espacios del programa (sala, cocina, alcobas…) con su área. CIVIA los usa como contexto.</p></div>`}
      </div>
      <div class="stack lg">
        ${canEdit ? html`<form class="card pad" id="room-form"><div class="eyebrow" style="margin-bottom:14px">Agregar espacio</div><div class="form-grid">
          <div class="field full"><label>Nombre</label><input class="input" name="name" required placeholder="Alcoba principal"></div>
          <div class="field"><label>Tipo</label><select class="input" name="roomType">${['Social', 'Privado', 'Servicio', 'Circulación', 'Exterior', 'Técnico'].map((t) => html`<option>${t}</option>`)}</select></div>
          <div class="field"><label>Área (m²)</label><input class="input" type="number" step="any" min="0" name="area"></div>
          <div class="field full"><label>Nivel</label><select class="input" name="levelId"><option value="">—</option>${levels.map((l) => html`<option value="${l.id}">${l.name}</option>`)}</select></div>
        </div><button class="btn primary block" style="margin-top:14px">${icon('plus')} Agregar</button></form>` : ''}
        <div class="card"><div class="card-head"><h3>Niveles</h3>${canEdit ? html`<button class="btn sm" data-level>${icon('plus')}</button>` : ''}</div>
          <div class="card-body">${levels.length ? levels.map((l) => html`<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${l.name}</span>
            <span class="row"><span class="mono faint">${l.elevation != null ? `N${l.elevation >= 0 ? '+' : ''}${fmtNum(l.elevation)}` : ''}</span>${canEdit ? html`<button class="btn sm ghost icon" data-del-level="${l.id}">${icon('trash')}</button>` : ''}</span></div>`)
            : html`<p class="faint">Sin niveles.</p>`}</div></div>
      </div></div>`);
  };
  draw();
  el.addEventListener('submit', async (e) => {
    if (e.target.id !== 'room-form') return;
    e.preventDefault();
    const d = formData(e.target);
    rooms.push(await api.post(`/projects/${project.id}/rooms`, { name: d.name, roomType: d.roomType, area: d.area ? Number(d.area) : null, levelId: d.levelId || null }));
    draw();
  });
  on(el, 'click', '[data-del-room]', async (e, b) => { await api.del(`/projects/${project.id}/rooms/${b.dataset.delRoom}`); rooms = rooms.filter((r) => r.id !== b.dataset.delRoom); draw(); });
  on(el, 'click', '[data-del-level]', async (e, b) => { await api.del(`/projects/${project.id}/levels/${b.dataset.delLevel}`); levels = levels.filter((l) => l.id !== b.dataset.delLevel); rooms = await api.get(`/projects/${project.id}/rooms`); draw(); });
  on(el, 'click', '[data-level]', () => {
    const m = modal({ title: 'Nuevo nivel', body: html`<div class="form-grid"><div class="field"><label>Nombre</label><input class="input" id="lv-name" value="Piso ${levels.length + 1}"></div>
      <div class="field"><label>Cota (m)</label><input class="input" id="lv-el" type="number" step="any" value="${(levels.length * 3).toFixed(2)}"></div></div>`,
      foot: html`<button class="btn primary" data-ok>Agregar</button>` });
    m.el.querySelector('[data-ok]').onclick = async () => {
      levels.push(await api.post(`/projects/${project.id}/levels`, { name: $('#lv-name', m.el).value, elevation: Number($('#lv-el', m.el).value), height: 3, sortOrder: levels.length }));
      m.close();
      draw();
    };
  });
}

// ------------------------------------------------------------------ equipo

async function team(el, project) {
  let members = await api.get(`/projects/${project.id}/members`);
  const isOwner = project.role === 'OWNER';
  const ROLE = { OWNER: 'Propietario', EDITOR: 'Editor', VIEWER: 'Lector' };
  const draw = () => mount(el, html`<div class="split">
    <div class="card"><div class="card-head"><h3>Miembros</h3><span class="pill">${members.length}</span></div>
      <div class="card-body">${members.map((m) => html`<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)">
        ${avatar(m.fullName, m.avatarColor)}<div><div>${m.fullName}</div><div class="hint">${m.email}</div></div>
        <span class="right pill ${m.role === 'OWNER' ? 'gold' : ''}">${ROLE[m.role]}</span>
        ${isOwner && m.role !== 'OWNER' ? html`<button class="btn sm ghost icon" data-remove="${m.id}">${icon('x')}</button>` : ''}</div>`)}</div></div>
    ${isOwner ? html`<form class="card pad" id="invite"><div class="eyebrow gold" style="margin-bottom:14px">Agregar colaborador</div>
      <div class="stack"><div class="field"><label>Correo de su cuenta CIVIA</label><input class="input" type="email" name="email" required></div>
      <div class="field"><label>Rol</label><select class="input" name="role"><option value="EDITOR">Editor (puede subir y editar)</option><option value="VIEWER">Lector (solo ver y comentar)</option></select></div>
      <button class="btn primary">${icon('plus')} Agregar</button></div></form>`
      : html`<div class="card pad"><p class="muted">Solo el propietario puede gestionar el equipo.</p></div>`}
  </div>`);
  draw();
  el.addEventListener('submit', async (e) => {
    if (e.target.id !== 'invite') return;
    e.preventDefault();
    members.push(await api.post(`/projects/${project.id}/members`, formData(e.target)));
    toast('Colaborador agregado');
    draw();
  });
  on(el, 'click', '[data-remove]', async (e, b) => {
    await api.del(`/projects/${project.id}/members/${b.dataset.remove}`);
    members = members.filter((m) => m.id !== b.dataset.remove);
    draw();
  });
}

// ------------------------------------------------------------------ bitácora

async function log(el, project) {
  const [activity, comments] = await Promise.all([api.get(`/projects/${project.id}/activity`), api.get(`/projects/${project.id}/comments`)]);
  mount(el, html`<div class="split">
    <div class="card"><div class="card-head"><h3>Bitácora</h3></div><div class="card-body">
      ${activity.length ? activity.map((a) => html`<div class="row" style="padding:11px 0;border-bottom:1px solid var(--line);align-items:flex-start">
        <span class="dot" style="color:var(--gold);margin-top:8px;flex:none"></span><div><div>${a.detail}</div><div class="hint">${a.userName} · ${relTime(a.createdAt)}</div></div></div>`)
      : html`<p class="faint">Sin actividad todavía.</p>`}</div></div>
    <div class="card"><div class="card-head"><h3>Conversación del equipo</h3></div><div class="card-body stack">
      <form class="row" id="c-form"><input class="input" name="body" placeholder="Escribe al equipo…"><button class="btn primary">${icon('send')}</button></form>
      ${comments.filter((c) => !c.targetId).map((c) => html`<div class="row" style="align-items:flex-start">${avatar(c.authorName, c.authorColor)}
        <div><div style="font-size:13px"><b>${c.authorName}</b> <span class="hint">${relTime(c.createdAt)}</span></div><div class="md" style="font-size:13.5px">${markdown(c.body)}</div></div></div>`)}
    </div></div></div>`);
  $('#c-form', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!e.target.body.value.trim()) return;
    await api.post(`/projects/${project.id}/comments`, { body: e.target.body.value });
    log(el, project);
  });
}
