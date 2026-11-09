// Calculadoras de ingeniería civil: formulario generado desde el catálogo del backend, resultado en
// vivo con pasos y avisos, y memoria de cálculo en PDF.
import { api, downloadPost } from '../api.js';
import { $, debounce, html, icon, mount, on, toast } from '../ui.js';

let catalogCache = null;
const catalog = async () => (catalogCache ||= await api.get('/calc'));

const fmt = (v, d) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

export async function render(el, { id }) {
  const list = await catalog();
  if (!id) return home(el, list);
  const def = list.find((c) => c.id === id);
  if (!def) { location.hash = '#/calc'; return undefined; }
  const projects = await api.get('/projects').catch(() => []);

  mount(el, html`
  <div class="page-head" style="margin-bottom:18px">
    <div><a class="btn ghost sm" href="#/calc" style="margin-left:-8px">${icon('back')} Calculadoras</a>
      <div class="eyebrow gold" style="margin-top:12px">${def.category}</div><h1>${def.name}</h1><p class="muted">${def.summary}</p></div>
  </div>
  <div class="calc-layout">
    <form class="card pad calc-form" id="calc-form" novalidate>
      ${def.fields.map((f) => (f.options.length
        ? html`<div class="field"><label for="f-${f.id}">${f.label}</label><select class="input" id="f-${f.id}" name="${f.id}">
            ${f.options.map((o) => html`<option value="${o.value}" ${o.value === f.defaultValue ? 'selected' : ''}>${o.label}</option>`)}</select>
            ${f.help ? html`<div class="hint">${f.help}</div>` : ''}</div>`
        : html`<div class="field"><label for="f-${f.id}">${f.label}</label>
            <div class="input-wrap unit"><input class="input" id="f-${f.id}" name="${f.id}" type="number" inputmode="decimal" value="${f.defaultValue}" min="${f.min}" max="${f.max}" step="${f.step}">
            ${f.unit ? html`<span class="unit-tag">${f.unit}</span>` : ''}</div>
            ${f.help ? html`<div class="hint">${f.help}</div>` : ''}</div>`))}
      <div class="sep"></div>
      <div class="field"><label for="calc-project">Proyecto (para la memoria)</label>
        <select class="input" id="calc-project"><option value="">Sin proyecto</option>${projects.map((p) => html`<option value="${p.id}">${p.name}</option>`)}</select></div>
      <button class="btn primary block" type="button" id="calc-pdf" data-busy="Generando…">${icon('report')} Descargar memoria de cálculo (PDF)</button>
    </form>
    <div class="stack lg" id="calc-result"><div class="card skeleton" style="height:220px"></div></div>
  </div>`);

  const form = $('#calc-form', el);
  const inputs = () => Object.fromEntries([...form.querySelectorAll('[name]')].map((i) => [i.name, Number(i.value)]));

  const run = async () => {
    const box = $('#calc-result', el);
    try {
      const r = await api.post(`/calc/${def.id}`, { inputs: inputs() });
      const main = r.values.filter((v) => v.highlight);
      const rest = r.values.filter((v) => !v.highlight);
      mount(box, html`
        <div class="calc-main">${main.map((v) => html`<div class="card glow calc-metric"><div class="eyebrow">${v.label}</div>
          <div class="val">${fmt(v.value, v.decimals)}</div><div class="hint">${v.unit}</div></div>`)}</div>
        ${r.warnings.length ? html`<div class="calc-warn">${icon('alert')}<ul>${r.warnings.map((w) => html`<li>${w}</li>`)}</ul></div>` : ''}
        <div class="card"><div class="card-head"><h3>Resultados</h3><span class="pill">${r.name}</span></div>
          <table class="table"><tbody>${rest.map((v) => html`<tr><td>${v.label}</td><td class="num">${fmt(v.value, v.decimals)}</td><td class="faint">${v.unit}</td></tr>`)}</tbody></table></div>
        <div class="card"><div class="card-head"><h3>Procedimiento</h3></div>
          <ol class="calc-steps">${r.steps.map((s) => html`<li>${s}</li>`)}</ol>
          <p class="hint" style="padding:0 24px 20px">Referencia: ${r.reference}. Cálculo orientativo: el diseño definitivo lo firma el profesional responsable.</p></div>`);
    } catch (e) {
      mount(box, html`<div class="card pad"><div class="error-text">${e.message}</div></div>`);
    }
  };
  form.addEventListener('input', debounce(run, 280));
  form.addEventListener('submit', (e) => e.preventDefault());
  $('#calc-pdf', el).addEventListener('click', async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    try {
      await downloadPost(`/calc/${def.id}/report`, { inputs: inputs(), projectId: $('#calc-project', el).value || null }, `memoria-${def.id}.pdf`);
      toast('Memoria de cálculo descargada');
    } catch (err) { toast(err.message, 'error'); } finally { b.disabled = false; }
  });
  await run();
  return undefined;
}

function home(el, list) {
  const cats = [...new Set(list.map((c) => c.category))];
  mount(el, html`<div class="page-head"><div><div class="eyebrow gold">Herramientas</div><h1>Calculadoras de <span class="chrome-text">ingeniería</span></h1>
    <p class="muted">Predimensionamiento y verificaciones rápidas con fórmulas de norma, pasos explicados y memoria de cálculo en PDF.</p></div></div>
    ${cats.map((cat) => html`<div class="eyebrow" style="margin:22px 0 12px">${cat}</div>
      <div class="grid g3">${list.filter((c) => c.category === cat).map((c) => html`<a class="card hover cat-card" href="#/calc/${c.id}">
        <div class="ico">${icon(c.icon)}</div><h3>${c.name}</h3><p>${c.summary}</p></a>`)}</div>`)}`);
  return undefined;
}
