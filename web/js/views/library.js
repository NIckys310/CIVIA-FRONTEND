// Biblioteca de arquitectura: una pregunta → respuesta con fuentes; categorías, artículos y glosario.
import { api } from '../api.js';
import { $, busy, formData, html, icon, markdown, modal, mount, on, toast } from '../ui.js';

let categoriesCache = null;
const categories = async () => (categoriesCache ||= await api.get('/library/categories'));
const catName = (cats, id) => cats.find((c) => c.id === id)?.name || id;

const articleCard = (a, cats) => html`<a class="card hover cat-card" href="#/library/a/${a.slug}">
  <div class="row between"><span class="eyebrow" style="font-size:9.5px">${catName(cats, a.category)}</span>${a.custom ? html`<span class="pill steel">Del estudio</span>` : ''}</div>
  <h3 style="margin-top:10px">${a.title}</h3><p>${a.summary}</p></a>`;

const nav = (active) => html`<div class="tabs" style="margin-bottom:20px">
  <a href="#/library" class="${active === 'home' ? 'active' : ''}">${icon('book')} Biblioteca</a>
  <a href="#/library/glossary" class="${active === 'glossary' ? 'active' : ''}">${icon('note')} Glosario</a>
  <a href="#/library/favorites" class="${active === 'favorites' ? 'active' : ''}">${icon('star')} Favoritos</a></div>`;

function askBox(q = '') {
  return html`<div class="card glow ask-hero">
    <div class="eyebrow gold">Biblioteca de arquitectura</div>
    <h1 style="margin-top:14px">Todo lo de arquitectura, <span class="chrome-text">con una sola pregunta</span></h1>
    <p class="muted" style="margin-top:10px;max-width:640px">Historia y estilos, diseño, dimensiones, estructuras, materiales, instalaciones, normativa, sostenibilidad, planos, BIM, urbanismo, gestión e interiorismo. Las respuestas citan sus fuentes.</p>
    <form class="box" id="ask-form"><input name="q" value="${q}" placeholder="Ej. ¿Qué pendiente máxima debe tener una rampa accesible?" autocomplete="off">
      <button class="btn primary" data-busy="Buscando…">${icon('sparkle')} Preguntar</button></form>
    <div id="answer"></div>
  </div>`;
}

async function ask(el, q, button) {
  const run = async () => {
    const [answer, results] = await Promise.all([api.post('/library/ask', { question: q }), api.get(`/library/search?q=${encodeURIComponent(q)}`)]);
    mount($('#answer', el), html`<div class="sep"></div>
      <div class="md">${markdown(answer.text)}</div>
      ${answer.sources?.length ? html`<div class="chips" style="margin-top:14px">${answer.sources.map((s) => (s.slug
        ? html`<a class="chip" href="#/library/a/${s.slug}">${icon('book')}<span class="mono" style="color:var(--gold-2)">${s.marker}</span> ${s.title}${s.section && s.section !== 'Introducción' ? ` · ${s.section}` : ''}</a>`
        : html`<span class="chip">${icon('note')}<span class="mono" style="color:var(--gold-2)">${s.marker}</span> ${s.title}</span>`))}</div>` : ''}
      <div class="row wrap" style="margin-top:16px"><span class="hint">${answer.engine}</span>
        <a class="btn sm right" href="#/copilot" id="continue">${icon('sparkle')} Seguir conversando en Copilot</a></div>
      ${results.terms.length ? html`<div class="eyebrow" style="margin:22px 0 6px">Glosario</div>${results.terms.map((t) => html`<div class="term"><b>${t.term}</b><p>${t.definition}</p></div>`)}` : ''}`);
    $('#continue', el).onclick = () => sessionStorage.setItem('civia-copilot-draft', q);
    const cats = await categories();
    const rel = $('#related', el);
    if (rel) mount(rel, results.articles.length ? html`<div class="eyebrow" style="margin:6px 0 14px">Artículos relacionados</div><div class="grid g3">${results.articles.map((a) => articleCard(a, cats))}</div>` : '');
  };
  return button ? busy(button, run) : run();
}

function bindAsk(el) {
  $('#ask-form', el).addEventListener('submit', (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (q) location.hash = `#/library/s/${encodeURIComponent(q)}`;
  });
}

export async function render(el, params) {
  const cats = await categories();
  const { view } = params;

  if (view === 'home' || view === 'search') {
    mount(el, html`${nav('home')}${askBox(params.q || '')}
      <div id="related" style="margin-top:22px"></div>
      ${view === 'home' ? html`
      <div class="row between" style="margin:30px 0 16px"><div class="eyebrow gold">Categorías</div>
        <button class="btn sm" id="new-article">${icon('plus')} Aportar un artículo</button></div>
      <div class="grid g4">${cats.map((c) => html`<a class="card hover cat-card" href="#/library/c/${c.id}">
        <div class="ico">${icon(c.icon)}</div>
        <h3>${c.name}</h3><p>${c.description}</p><div class="hint" style="margin-top:12px">${c.articles} artículos</div></a>`)}</div>` : ''}`);
    bindAsk(el);
    $('#new-article', el)?.addEventListener('click', () => newArticle(cats));
    if (view === 'search') await ask(el, params.q, $('#ask-form button', el));
    return;
  }

  if (view === 'category') {
    const list = await api.get(`/library/articles?category=${encodeURIComponent(params.id)}`);
    const c = cats.find((x) => x.id === params.id);
    mount(el, html`${nav('')}<div class="page-head"><div><a class="btn ghost sm" href="#/library" style="margin-left:-8px">${icon('back')} Biblioteca</a>
      <h1 style="margin-top:12px">${c?.name || params.id}</h1><p class="muted">${c?.description || ''}</p></div></div>
      <div class="grid g3">${list.map((a) => articleCard(a, cats))}</div>`);
    return;
  }

  if (view === 'article') {
    const a = await api.get(`/library/articles/${encodeURIComponent(params.slug)}`);
    mount(el, html`${nav('')}
      <div class="split">
        <article class="card pad article" style="max-width:none">
          <a class="btn ghost sm" href="#/library/c/${a.category}" style="margin-left:-8px">${icon('back')} ${catName(cats, a.category)}</a>
          <h1 style="margin:16px 0 10px">${a.title}</h1>
          <p class="muted" style="font-size:16px">${a.summary}</p>
          <div class="row wrap" style="margin:16px 0 4px">${a.tags.map((t) => html`<a class="pill" href="#/library/s/${encodeURIComponent(t)}">${t}</a>`)}</div>
          <div class="sep"></div>
          <div class="md">${markdown(a.body)}</div>
          <p class="hint" style="margin-top:28px">Contenido orientativo. Verifica siempre la normativa local vigente y la validación del profesional responsable.</p>
        </article>
        <div class="stack lg">
          <div class="card pad stack">
            <button class="btn ${a.favorite ? 'primary' : ''}" id="fav">${icon('star')} ${a.favorite ? 'En favoritos' : 'Guardar en favoritos'}</button>
            <button class="btn" id="ask-about">${icon('sparkle')} Preguntar a Copilot sobre esto</button>
          </div>
          ${a.related.length ? html`<div class="card"><div class="card-head"><h3>Relacionados</h3></div><div class="card-body stack">
            ${a.related.map((r) => html`<a class="row between" href="#/library/a/${r.slug}" style="padding:6px 0"><span>${r.title}</span>${icon('chevron')}</a>`)}</div></div>` : ''}
        </div>
      </div>`);
    let fav = a.favorite;
    $('#fav', el).onclick = async (e) => {
      fav = !fav;
      await (fav ? api.put(`/library/favorites/${a.slug}`) : api.del(`/library/favorites/${a.slug}`));
      e.currentTarget.classList.toggle('primary', fav);
      e.currentTarget.lastChild.textContent = fav ? ' En favoritos' : ' Guardar en favoritos';
    };
    $('#ask-about', el).onclick = () => {
      sessionStorage.setItem('civia-copilot-draft', `Explícame más sobre «${a.title}» y cómo aplicarlo en un proyecto.`);
      location.hash = '#/copilot';
    };
    return;
  }

  if (view === 'favorites') {
    const list = await api.get('/library/favorites');
    mount(el, html`${nav('favorites')}<div class="page-head"><div><div class="eyebrow gold">Biblioteca</div><h1>Favoritos</h1></div></div>
      ${list.length ? html`<div class="grid g3">${list.map((a) => articleCard(a, cats))}</div>`
        : html`<div class="card"><div class="empty">${icon('star', 'big')}<p>Guarda artículos para tenerlos a mano.</p></div></div>`}`);
    return;
  }

  if (view === 'glossary') {
    const terms = await api.get('/library/terms');
    const letters = [...new Set(terms.map((t) => t.term[0].toUpperCase().normalize('NFD').replace(/\p{M}/gu, '')))].sort();
    let filter = '';
    let letter = '';
    mount(el, html`${nav('glossary')}<div class="page-head"><div><div class="eyebrow gold">Biblioteca</div><h1>Glosario de arquitectura</h1>
      <p class="muted">${terms.length} términos.</p></div>
      <label class="search" style="max-width:320px">${icon('search')}<input id="g-filter" placeholder="Buscar término"></label></div>
      <div class="alpha" style="margin-bottom:18px"><button class="active" data-l="">Todos</button>${letters.map((l) => html`<button data-l="${l}">${l}</button>`)}</div>
      <div class="card pad" id="g-list"></div>`);
    const draw = () => {
      const list = terms.filter((t) => (!letter || t.term.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().startsWith(letter))
        && (!filter || `${t.term} ${t.definition}`.toLowerCase().includes(filter)));
      mount($('#g-list', el), list.length ? html`${list.map((t) => html`<div class="term"><div class="row between"><b>${t.term}</b><span class="pill">${catName(cats, t.category)}</span></div><p>${t.definition}</p></div>`)}`
        : html`<p class="faint">Sin resultados.</p>`);
    };
    draw();
    $('#g-filter', el).addEventListener('input', (e) => { filter = e.target.value.toLowerCase(); draw(); });
    on(el, 'click', '[data-l]', (e, b) => { letter = b.dataset.l; el.querySelectorAll('[data-l]').forEach((x) => x.classList.toggle('active', x === b)); draw(); });
  }
}

function newArticle(cats) {
  const m = modal({
    title: 'Aportar un artículo', eyebrow: 'Biblioteca del estudio', wide: true,
    body: html`<form id="art-form" class="form-grid">
      <div class="field full"><label>Título</label><input class="input" name="title" required></div>
      <div class="field"><label>Categoría</label><select class="input" name="category">${cats.map((c) => html`<option value="${c.id}">${c.name}</option>`)}</select></div>
      <div class="field"><label>Etiquetas (separadas por coma)</label><input class="input" name="tags" placeholder="fachada, vidrio"></div>
      <div class="field full"><label>Resumen</label><input class="input" name="summary"></div>
      <div class="field full"><label>Contenido (admite ## títulos, listas y **negrita**)</label><textarea class="input" name="body" style="min-height:220px" required></textarea></div>
    </form>`,
    foot: html`<button class="btn ghost" data-cancel>Cancelar</button><button class="btn primary" data-save>Publicar</button>`,
  });
  m.el.querySelector('[data-cancel]').onclick = m.close;
  m.el.querySelector('[data-save]').onclick = async () => {
    const d = formData($('#art-form', m.el));
    if (!d.title.trim() || !d.body.trim()) return;
    const a = await api.post('/library/articles', { ...d, tags: d.tags.split(',').map((t) => t.trim()).filter(Boolean) });
    categoriesCache = null;
    m.close();
    toast('Artículo publicado en la biblioteca');
    location.hash = `#/library/a/${a.slug}`;
  };
}
