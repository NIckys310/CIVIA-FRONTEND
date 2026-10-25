// Perfil › Almacenamiento y caché: versión de la app, archivos guardados en el dispositivo y caché del servidor.
import { api } from '../api.js';
import { $, confirmDialog, fmtBytes, fmtNum, html, icon, mount, on, relTime, toast } from '../ui.js';
import { clearFiles, DEFAULT_MAX, listFiles, offlinePrefs, removeFile, storageEstimate } from '../offline.js';

const KIND = { MODEL_3D: ['Modelo 3D', 'gold'], PLAN: ['Plano', 'steel'], PHOTO: ['Foto', 'ok'], DOCUMENT: ['Documento', ''] };
const LIMITS = [[1024 ** 3, '1 GB'], [DEFAULT_MAX, '2 GB'], [5 * 1024 ** 3, '5 GB'], [0, 'Sin límite']];

async function appVersion() {
  const ctl = navigator.serviceWorker?.controller;
  if (!ctl) return null;
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => resolve(String(e.data || '').replace('civia-', ''));
    ctl.postMessage({ type: 'version' }, [ch.port2]);
    setTimeout(() => resolve(null), 1500);
  });
}

export async function storagePanel(host) {
  mount(host, html`<section class="card storage-card" aria-labelledby="st-title">
    <div class="card-head"><div><div class="eyebrow gold">Este dispositivo</div><h3 id="st-title" style="margin-top:6px">Almacenamiento y caché</h3></div>
      <div class="row wrap"><span class="pill" id="st-version">Versión…</span><button class="btn sm" id="st-update">${icon('refresh')} Buscar actualización</button></div></div>
    <div class="card-body storage-grid">
      <div class="stack" id="st-device"><div class="skeleton" style="height:160px"></div></div>
      <div class="stack" id="st-server"><div class="skeleton" style="height:160px"></div></div>
    </div>
    <div id="st-files"></div>
  </section>`);

  appVersion().then((v) => { $('#st-version', host).textContent = v ? `Versión ${v}` : 'Versión web'; });
  $('#st-update', host).onclick = async () => {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (!reg) { toast('Actualiza la página para cargar la última versión.', 'info'); return; }
    await reg.update().catch(() => {});
    if (reg.waiting || reg.installing) toast('Hay una versión nueva: usa «Actualizar ahora» en el aviso.', 'info');
    else toast('Ya tienes la última versión de CIVIA.');
  };

  const drawDevice = async () => {
    const [files, est] = await Promise.all([listFiles(), storageEstimate()]);
    const used = files.reduce((s, f) => s + f.size, 0);
    const max = offlinePrefs.maxBytes;
    const byKind = Object.keys(KIND).map((k) => ({ k, size: files.filter((f) => f.kind === k).reduce((s, f) => s + f.size, 0) })).filter((x) => x.size);
    const pct = (n) => (max ? Math.min(100, (n / max) * 100) : (est?.quota ? (n / est.quota) * 100 : 0));
    mount($('#st-device', host), html`
      <div class="row between"><b>Archivos sin conexión</b><span class="mono hint">${fmtBytes(used)}${max ? ` de ${fmtBytes(max)}` : ''}</span></div>
      <div class="usage-bar" role="img" aria-label="${fmtBytes(used)} usados">${byKind.map((x) => html`<i class="${KIND[x.k][1]}" style="width:${pct(x.size).toFixed(2)}%"></i>`)}</div>
      <ul class="legend">${byKind.length ? byKind.map((x) => html`<li><i class="${KIND[x.k][1]}"></i>${KIND[x.k][0]}<span>${fmtBytes(x.size)}</span></li>`) : html`<li class="faint">Aún no hay archivos guardados. Se guardan al abrirlos.</li>`}</ul>
      ${offlinePrefs.supported() ? '' : html`<p class="hint">Este navegador no permite guardar archivos sin conexión.</p>`}
      <label class="toggle-row"><input type="checkbox" class="toggle" id="st-on" ${offlinePrefs.enabled ? 'checked' : ''}><span><b>Guardar lo que abro</b><small>Modelos, planos y fotos quedan listos sin conexión</small></span></label>
      <div class="row between"><label for="st-max">Espacio máximo</label>
        <select class="input" id="st-max" style="width:auto">${LIMITS.map(([v, l]) => html`<option value="${v}" ${v === max ? 'selected' : ''}>${l}</option>`)}</select></div>
      <button class="btn block ghost danger" id="st-clear" ${files.length ? '' : 'disabled'}>${icon('trash')} Liberar espacio en este dispositivo</button>
      ${est?.quota ? html`<p class="hint">El navegador permite usar hasta ${fmtBytes(est.quota)} en este equipo.</p>` : ''}`);

    mount($('#st-files', host), files.length ? html`<div class="table-wrap"><table class="table">
      <thead><tr><th>Archivo</th><th>Tipo</th><th>Tamaño</th><th>Guardado</th><th><span class="sr-only">Acción</span></th></tr></thead>
      <tbody>${files.map((f) => html`<tr><td><span class="file-tag ${KIND[f.kind]?.[1] || ''}">${(f.extension || '').toUpperCase()}</span>${f.name}</td>
        <td class="faint">${KIND[f.kind]?.[0] || 'Archivo'}</td><td class="mono faint">${fmtBytes(f.size)}</td><td class="faint">${f.saved ? relTime(f.saved) : ''}</td>
        <td style="text-align:right"><button class="btn sm ghost" data-remove="${f.key}">Quitar</button></td></tr>`)}</tbody></table></div>` : '');

    $('#st-on', host).onchange = (e) => { offlinePrefs.enabled = e.target.checked; toast(e.target.checked ? 'Se guardarán los archivos que abras.' : 'Los archivos nuevos ya no se guardarán.'); };
    $('#st-max', host).onchange = (e) => { offlinePrefs.maxBytes = Number(e.target.value); toast('Espacio máximo actualizado.'); };
    $('#st-clear', host).onclick = async () => {
      if (!(await confirmDialog('Liberar espacio', 'Se borran los archivos guardados en este dispositivo. Siguen seguros en la nube y se descargan de nuevo al abrirlos.', 'Liberar espacio', true))) return;
      await clearFiles();
      toast('Espacio liberado.');
      drawDevice();
    };
  };
  on(host, 'click', '[data-remove]', async (e, b) => { await removeFile(b.dataset.remove); drawDevice(); });

  const drawServer = async () => {
    try {
      const c = await api.get('/system/cache');
      mount($('#st-server', host), html`
        <div class="row between"><b>Caché del servidor</b><span class="pill ${c.enabled ? 'ok' : ''}"><span class="dot"></span>${c.enabled ? 'Activa' : 'Sin datos aún'}</span></div>
        <div class="metric-grid three">
          <div class="metric"><div class="eyebrow">Aciertos</div><div class="display">${fmtNum(c.hitRate * 100, 0)}%</div></div>
          <div class="metric"><div class="eyebrow">Desde caché</div><div class="display">${fmtNum(c.hits, 0)}</div></div>
          <div class="metric"><div class="eyebrow">Calculadas</div><div class="display">${fmtNum(c.misses, 0)}</div></div>
        </div>
        ${c.caches.length ? html`<table class="table compact"><caption class="hint" style="text-align:left;padding-bottom:6px">Qué guarda el servidor y cuándo se renueva</caption>
          <thead><tr><th>Recurso</th><th>Guardados</th><th>Se renueva</th></tr></thead>
          <tbody>${c.caches.map((x) => html`<tr><td>${x.label}</td><td class="mono">${fmtNum(x.size, 0)}</td><td class="faint">${x.renews}</td></tr>`)}</tbody></table>` : ''}
        <p class="hint">Cada cambio vacía su caché al instante: nunca ves datos viejos.</p>`);
    } catch {
      mount($('#st-server', host), html`<b>Caché del servidor</b><p class="hint">Las estadísticas estarán disponibles cuando el servidor se actualice.</p>`);
    }
  };

  await Promise.all([drawDevice(), drawServer()]);
}
