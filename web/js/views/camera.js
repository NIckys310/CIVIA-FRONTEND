// Cámara de obra: fotos, fotos de planos (con análisis IA) y medición con objeto de referencia.
import { api, fileUrl, upload } from '../api.js';
import { $, busy, fmtNum, html, icon, mount, on, relTime, toast } from '../ui.js';
import { haptic } from '../motion.js';
import { showAnalysis } from './project.js';

const REFERENCES = [
  ['Hoja carta (alto)', 0.279], ['Hoja carta (ancho)', 0.216], ['Hoja A4 (alto)', 0.297], ['Hoja A4 (ancho)', 0.21],
  ['Puerta estándar (alto)', 2.1], ['Bloque de concreto', 0.4], ['Ladrillo (soga)', 0.25], ['Baldosa 60 cm', 0.6],
];

export async function render(el, { projectId }) {
  const projects = (await api.get('/projects')).filter((p) => p.role !== 'VIEWER' && !p.archived);
  if (!projects.length) {
    mount(el, html`<div class="page-head"><div><div class="eyebrow gold">Cámara</div><h1>Cámara de obra</h1></div></div>
      <div class="card"><div class="empty">${icon('camera', 'big')}<h3>Necesitas un proyecto</h3><p>Las fotos y mediciones se guardan dentro de un proyecto.</p>
      <a class="btn primary" href="#/projects?new">${icon('plus')} Crear proyecto</a></div></div>`);
    return null;
  }
  let current = projects.find((p) => p.id === projectId) || projects[0];

  mount(el, html`
  <div class="page-head">
    <div><div class="eyebrow gold">Cámara</div><h1>Cámara de obra</h1>
      <p class="muted">Registra el avance, fotografía planos para que la IA los revise y mide con un objeto de referencia.</p></div>
    <div class="row wrap">
      <select class="input" id="cam-project" style="width:auto;min-width:220px">${projects.map((p) => html`<option value="${p.id}" ${p.id === current.id ? 'selected' : ''}>${p.name}</option>`)}</select>
    </div>
  </div>
  <div class="split">
    <div class="stack lg">
      <div class="tabs" id="cam-mode" style="align-self:flex-start">
        <button class="active" data-mode="photo">${icon('camera')} Foto de obra</button>
        <button data-mode="plan">${icon('blueprint')} Foto de plano</button>
        <button data-mode="measure">${icon('ruler')} Medir</button>
      </div>
      <div class="camera" id="cam">
        <video id="video" playsinline muted autoplay></video>
        <canvas class="shot" id="shot" hidden></canvas>
        <canvas class="overlay" id="overlay" hidden></canvas>
        <div class="reticle" id="reticle"></div>
        <div class="controls" id="cam-controls">
          <label class="btn icon glass-panel" title="Elegir de la galería" aria-label="Elegir imagen">${icon('image')}<input type="file" accept="image/*" id="gallery" hidden></label>
          <button class="shutter" id="shutter" aria-label="Tomar foto"></button>
          <button class="btn icon glass-panel" id="flip" title="Cambiar cámara" aria-label="Cambiar cámara">${icon('switch')}</button>
        </div>
        <div class="empty" id="cam-error" hidden style="position:absolute;inset:0;color:#ddd;pointer-events:none;padding-bottom:110px"></div>
      </div>
    </div>
    <div class="stack lg">
      <div class="card pad" id="cam-side"></div>
      <div class="card"><div class="card-head"><h3>Recientes</h3><a class="btn sm ghost" id="to-files">Archivos ${icon('arrow')}</a></div>
        <div class="card-body" id="recent" style="padding:10px"></div></div>
    </div>
  </div>`);

  const video = $('#video', el);
  const shot = $('#shot', el);
  const overlay = $('#overlay', el);
  let stream = null;
  let facing = 'environment';
  let mode = 'photo';
  let captured = null; // Blob de la foto
  let refPts = [];
  let refLength = null;
  let lines = []; // { a, b, meters }
  let pending = [];

  async function start() {
    stop();
    $('#cam-error', el).hidden = true;
    $('#reticle', el).hidden = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      showError('Este navegador no permite usar la cámara aquí. Usa HTTPS o elige una imagen de la galería.');
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 3840 }, height: { ideal: 2160 } }, audio: false,
      });
      video.srcObject = stream;
      video.hidden = false;
    } catch (e) {
      showError(e.name === 'NotAllowedError'
        ? 'Permiso de cámara denegado. Actívalo en el navegador o elige una imagen de la galería.'
        : 'No se encontró una cámara disponible. Puedes elegir una imagen de la galería.');
    }
  }
  function stop() { stream?.getTracks().forEach((t) => t.stop()); stream = null; }
  function showError(msg) {
    const box = $('#cam-error', el);
    box.hidden = false;
    $('#reticle', el).hidden = true;
    mount(box, html`${icon('camera', 'big')}<p>${msg}</p>`);
  }

  function showCaptured(source, w, h) {
    shot.width = w;
    shot.height = h;
    shot.getContext('2d').drawImage(source, 0, 0, w, h);
    shot.hidden = false;
    overlay.hidden = mode !== 'measure';
    overlay.width = w;
    overlay.height = h;
    video.hidden = true;
    $('#cam-error', el).hidden = true;
    $('#reticle', el).hidden = true;
    $('#cam-controls', el).hidden = true;
    stop();
    refPts = [];
    refLength = null;
    lines = [];
    pending = [];
    drawOverlay();
    side();
  }

  function capture() {
    if (!video.videoWidth) return;
    showCaptured(video, video.videoWidth, video.videoHeight);
    shot.toBlob((b) => { captured = b; }, 'image/jpeg', 0.92);
  }

  $('#shutter', el).onclick = () => { haptic([8, 40, 8]); capture(); };
  $('#flip', el).onclick = () => { facing = facing === 'environment' ? 'user' : 'environment'; start(); };
  $('#gallery', el).addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      showCaptured(img, img.naturalWidth, img.naturalHeight);
      captured = file;
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  });

  function retake() {
    captured = null;
    shot.hidden = true;
    overlay.hidden = true;
    $('#reticle', el).hidden = false;
    $('#cam-controls', el).hidden = false;
    start();
    side();
  }

  // ---------------------------------------------------------------- medición
  const pxToImage = (e) => {
    const r = overlay.getBoundingClientRect();
    // La imagen se dibuja con object-fit: contain dentro del contenedor.
    const scale = Math.min(r.width / overlay.width, r.height / overlay.height);
    const ox = (r.width - overlay.width * scale) / 2;
    const oy = (r.height - overlay.height * scale) / 2;
    return { x: (e.clientX - r.left - ox) / scale, y: (e.clientY - r.top - oy) / scale };
  };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const metersPerPx = () => (refPts.length === 2 && refLength ? refLength / dist(refPts[0], refPts[1]) : null);

  function drawOverlay() {
    const g = overlay.getContext('2d');
    g.clearRect(0, 0, overlay.width, overlay.height);
    const lw = Math.max(2, overlay.width / 500);
    const dot = (p, color) => { g.fillStyle = color; g.beginPath(); g.arc(p.x, p.y, lw * 3, 0, Math.PI * 2); g.fill(); };
    const label = (a, b, text, color) => {
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      g.font = `600 ${lw * 9}px Inter, sans-serif`;
      const w = g.measureText(text).width + lw * 8;
      g.fillStyle = 'rgba(7,8,11,.85)';
      g.fillRect(m.x - w / 2, m.y - lw * 14, w, lw * 12);
      g.fillStyle = color;
      g.textAlign = 'center';
      g.fillText(text, m.x, m.y - lw * 5);
    };
    const seg = (a, b, color) => { g.strokeStyle = color; g.lineWidth = lw; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); dot(a, color); dot(b, color); };
    refPts.forEach((p) => dot(p, '#9fb2d3'));
    if (refPts.length === 2) { seg(refPts[0], refPts[1], '#9fb2d3'); if (refLength) label(refPts[0], refPts[1], `ref ${fmtNum(refLength, 3)} m`, '#c8d4ea'); }
    lines.forEach((l) => { seg(l.a, l.b, '#d6a46c'); label(l.a, l.b, `${fmtNum(l.meters, 2)} m`, '#f2cf9f'); });
    pending.forEach((p) => dot(p, '#f2cf9f'));
  }

  overlay.addEventListener('pointerdown', (e) => {
    const p = pxToImage(e);
    if (refPts.length < 2) {
      refPts.push(p);
      if (refPts.length === 2) side();
    } else if (metersPerPx()) {
      pending.push(p);
      if (pending.length === 2) {
        lines.push({ a: pending[0], b: pending[1], meters: dist(pending[0], pending[1]) * metersPerPx() });
        pending = [];
        side();
      }
    } else {
      toast('Primero escribe la medida real de la referencia.', 'info');
    }
    drawOverlay();
  });

  // ---------------------------------------------------------------- panel lateral
  function side() {
    const box = $('#cam-side', el);
    if (!captured && shot.hidden) {
      mount(box, html`<div class="eyebrow gold">${mode === 'plan' ? 'Foto de plano' : mode === 'measure' ? 'Medición' : 'Foto de obra'}</div>
        <h3 style="margin:10px 0 8px">${mode === 'plan' ? 'Fotografía el plano de frente' : mode === 'measure' ? 'Incluye un objeto de medida conocida' : 'Documenta el avance'}</h3>
        <p class="muted" style="font-size:13px">${mode === 'plan'
          ? 'Buena luz, sin sombras y con la escala gráfica visible. CIVIA lo guardará como plano y lo analizará.'
          : mode === 'measure'
            ? 'Una hoja carta, una puerta o una baldosa sirven de referencia. Mantén la cámara perpendicular a la superficie que mides.'
            : 'La foto se guarda en el proyecto con fecha y, si lo autorizas, con ubicación.'}</p>
        <label class="check" style="margin-top:16px"><input type="checkbox" id="geo"> Guardar ubicación GPS</label>`);
      return;
    }
    const mpp = metersPerPx();
    mount(box, html`
      ${mode === 'measure' ? html`
        <div class="eyebrow gold">Medición</div>
        <ol class="md" style="font-size:13px;margin:10px 0 14px">
          <li style="${refPts.length === 2 ? 'color:var(--text-3)' : ''}">Toca los dos extremos del objeto de referencia (${refPts.length}/2).</li>
          <li style="${mpp ? 'color:var(--text-3)' : ''}">Indica su medida real.</li>
          <li>Toca dos puntos para medir cada distancia.</li>
        </ol>
        ${refPts.length === 2 ? html`<div class="field"><label>Referencia</label>
          <select class="input" id="ref-preset"><option value="">Personalizada…</option>${REFERENCES.map(([l, v]) => html`<option value="${v}" ${refLength === v ? 'selected' : ''}>${l} · ${v} m</option>`)}</select>
          <input class="input" id="ref-len" type="number" step="any" min="0" placeholder="Medida real en metros" value="${refLength ?? ''}"></div>` : ''}
        ${lines.length ? html`<div class="stack" style="margin-top:14px">${lines.map((l, i) => html`<div class="row"><input class="input" data-label="${i}" value="${l.label || `Medida ${i + 1}`}" style="min-height:34px;padding:6px 10px">
          <span class="mono" style="white-space:nowrap">${fmtNum(l.meters, 2)} m</span></div>`)}</div>` : ''}
        <p class="hint" style="margin-top:12px">Estimación. Confirma en obra con cinta o distanciómetro.</p>` : ''}
      <div class="field" style="margin-top:14px"><label>Nota</label><textarea class="input" id="note" placeholder="${mode === 'plan' ? 'Ej. Planta primer piso, revisión 2' : 'Ej. Fundida de losa N+3.00, eje B-C'}"></textarea></div>
      <label class="check" style="margin-top:12px"><input type="checkbox" id="geo"> Guardar ubicación GPS</label>
      <div class="row" style="margin-top:16px">
        <button class="btn" id="retake">${icon('rotate')} Repetir</button>
        <button class="btn primary right" id="save" data-busy="Guardando…">${icon('upload')} ${mode === 'plan' ? 'Guardar y analizar' : 'Guardar'}</button>
      </div>`);
    $('#retake', box).onclick = retake;
    $('#ref-preset', box)?.addEventListener('change', (e) => { if (e.target.value) { refLength = Number(e.target.value); $('#ref-len', box).value = refLength; recompute(); } });
    $('#ref-len', box)?.addEventListener('change', (e) => { refLength = Number(e.target.value) || null; recompute(); });
    on(box, 'input', '[data-label]', (e, input) => { lines[Number(input.dataset.label)].label = input.value; });
    $('#save', box).onclick = (e) => busy(e.currentTarget, save);
  }
  function recompute() {
    const mpp = metersPerPx();
    lines.forEach((l) => { l.meters = mpp ? dist(l.a, l.b) * mpp : 0; });
    drawOverlay();
    side();
  }

  async function position() {
    if (!$('#geo', el)?.checked || !navigator.geolocation) return {};
    return new Promise((resolve) => navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }), () => resolve({}), { timeout: 8000 },
    ));
  }

  async function save() {
    if (!captured) {
      captured = await new Promise((r) => shot.toBlob(r, 'image/jpeg', 0.92));
    }
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    const file = new File([captured], `${mode === 'plan' ? 'plano' : 'obra'}-${stamp}.jpg`, { type: 'image/jpeg' });
    const geo = await position();
    const doc = await upload(`/projects/${current.id}/documents`, file, {
      kind: mode === 'plan' ? 'PLAN' : 'PHOTO', description: $('#note', el)?.value || '', deviceInfo: navigator.userAgent.slice(0, 160), ...geo,
    });
    for (const [i, l] of lines.entries()) {
      await api.post(`/projects/${current.id}/measurements`, {
        documentId: doc.id, label: l.label || `Medida ${i + 1}`, value: Number(l.meters.toFixed(3)), unit: 'm', referenceLength: refLength,
        pointsJson: JSON.stringify({ reference: refPts, a: l.a, b: l.b, image: [shot.width, shot.height] }),
      });
    }
    toast(mode === 'plan' ? 'Plano guardado. Analizando…' : `Foto guardada${lines.length ? ` con ${lines.length} medición(es)` : ''}`);
    if (mode === 'plan') {
      const analysis = await api.post(`/ai/documents/${doc.id}/analyze`, {});
      showAnalysis(analysis, current);
    }
    retake();
    loadRecent();
  }

  async function loadRecent() {
    const [photos, plans, measures] = await Promise.all([
      api.get(`/projects/${current.id}/documents?kind=PHOTO`), api.get(`/projects/${current.id}/documents?kind=PLAN`), api.get(`/projects/${current.id}/measurements`),
    ]);
    const images = [...photos, ...plans.filter((p) => p.mediaType.startsWith('image/'))].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
    const box = $('#recent', el);
    if (!box) return;
    mount(box, html`${images.length ? html`<div class="grid g3" style="gap:8px">${images.map((d) => html`<div class="preview" style="min-height:0;aspect-ratio:1" data-thumb="${d.id}" title="${d.name}"></div>`)}</div>` : html`<p class="faint" style="padding:8px">Aún no hay fotos.</p>`}
      ${measures.length ? html`<div class="eyebrow" style="margin:16px 6px 6px">Mediciones</div>${measures.slice(0, 8).map((m) => html`<div class="row between" style="padding:8px 6px;border-bottom:1px solid var(--line);font-size:13px"><span>${m.label}</span><span class="mono">${fmtNum(m.value, 2)} ${m.unit}</span><span class="hint">${relTime(m.createdAt)}</span></div>`)}` : ''}`);
    images.forEach(async (d) => {
      const url = await fileUrl(d.id, d);
      const cell = box.querySelector(`[data-thumb="${d.id}"]`);
      if (cell) mount(cell, html`<img src="${url}" alt="${d.name}" style="width:100%;height:100%;object-fit:cover">`);
    });
    $('#to-files', el).href = `#/projects/${current.id}/files`;
  }

  on(el, 'click', '[data-mode]', (e, b) => {
    mode = b.dataset.mode;
    el.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('active', x === b));
    overlay.hidden = mode !== 'measure' || shot.hidden;
    side();
  });
  $('#cam-project', el).addEventListener('change', (e) => { current = projects.find((p) => p.id === e.target.value); loadRecent(); });

  side();
  start();
  loadRecent();
  return () => stop();
}
