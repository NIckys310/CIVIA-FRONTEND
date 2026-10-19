// CIVIA Copilot: chat con la IA de arquitectura, con contexto de proyecto y archivos adjuntos.
import { api } from '../api.js';
import { $, html, icon, markdown, mount, on, relTime } from '../ui.js';

export async function render(el, { conversationId, query }) {
  const [conversations, projects, status] = await Promise.all([
    api.get('/ai/conversations'), api.get('/projects'), api.get('/ai/status'),
  ]);
  let activeId = conversationId || null;
  let projectId = query?.get('project') || null;
  let attached = [];
  let docs = [];

  mount(el, html`
  <div class="chat">
    <div class="card list-card" style="display:flex;flex-direction:column;min-height:0">
      <div class="card-head" style="padding:16px"><span class="eyebrow gold">Conversaciones</span>
        <a class="btn sm primary" href="#/copilot">${icon('plus')} Nueva</a></div>
      <div class="list" id="conv-list"></div>
    </div>
    <div class="card thread">
      <div class="card-head" style="padding:12px 18px">
        <div class="row" style="min-width:0">
          <img src="/assets/mark-96.png" alt="" width="30" height="30" style="mix-blend-mode:screen;border-radius:8px">
          <div><div style="font:500 15px var(--display)">CIVIA <span class="ai-text">Copilot</span></div>
          <div class="hint">${status.llm ? status.engine : 'Motor local · biblioteca con citas'}</div></div>
        </div>
        <div class="row">
          <select class="input" id="ctx-project" style="width:auto;min-height:34px;padding:5px 32px 5px 10px;font-size:13px">
            <option value="">Sin proyecto</option>${projects.map((p) => html`<option value="${p.id}" ${p.id === projectId ? 'selected' : ''}>${p.name}</option>`)}
          </select>
        </div>
      </div>
      <div class="messages" id="messages"></div>
      <div class="composer">
        <div class="chips" id="attached" style="margin-bottom:8px"></div>
        <form class="box" id="composer">
          <button type="button" class="btn ghost icon sm" id="attach" title="Adjuntar planos del proyecto" aria-label="Adjuntar">${icon('clip')}</button>
          <textarea id="input" rows="1" placeholder="Pregunta sobre arquitectura, tu proyecto, un plano o un modelo 3D…"></textarea>
          <button class="btn primary icon" aria-label="Enviar">${icon('send')}</button>
        </form>
        <div class="hint" style="margin-top:8px;text-align:center">CIVIA puede equivocarse. Requiere revisión y aprobación del profesional responsable.</div>
      </div>
    </div>
  </div>`);

  const list = $('#conv-list', el);
  const box = $('#messages', el);
  const input = $('#input', el);

  const drawList = () => mount(list, conversations.length
    ? html`${conversations.map((c) => html`<a class="conv ${c.id === activeId ? 'active' : ''}" href="#/copilot/${c.id}" title="${c.title}">
        ${c.title}<div class="hint" style="font-size:11px">${c.projectName ? `${c.projectName} · ` : ''}${relTime(c.updatedAt)}</div></a>`)}`
    : html`<p class="hint" style="padding:12px">Tus conversaciones aparecerán aquí.</p>`);
  drawList();

  const sourcesHtml = (sources) => (sources?.length ? html`<div class="meta">${sources.map((s) => (s.slug
    ? html`<a class="chip" href="#/library/a/${s.slug}" title="${s.section || ''}">${icon('book')}<span class="mono" style="color:var(--gold-2)">${s.marker}</span> ${s.title}</a>`
    : html`<span class="chip">${icon('book')}<span class="mono" style="color:var(--gold-2)">${s.marker}</span> ${s.title}</span>`))}</div>` : '');

  const msgHtml = (m) => (m.role === 'user'
    ? html`<div class="msg user"><div class="bubble">${m.content}</div></div>`
    : html`<div class="msg"><div class="who"><img src="/assets/mark-96.png" alt=""></div><div>
        <div class="md">${markdown(m.content)}</div>
        ${sourcesHtml(m.sources)}
        ${m.suggestions?.length ? html`<div class="chips" style="margin-top:12px">${m.suggestions.map((s) => html`<button class="chip" data-suggest="${s}">${icon('sparkle')}${s}</button>`)}</div>` : ''}
        <div class="hint" style="margin-top:8px">${m.engine || ''}</div></div></div>`);

  const welcome = () => mount(box, html`<div class="empty" style="margin:auto">
      <img src="/assets/mark-256.png" alt="" width="120" height="120">
      <h2 class="display" style="font-size:30px">¿En qué <span class="chrome-text">diseñamos</span> hoy?</h2>
      <p>Pregunta sobre normativa, dimensiones, materiales, estructuras o sostenibilidad. Elige un proyecto para que CIVIA conozca su contexto y te diga qué le falta.</p>
      <div class="chips" style="justify-content:center">
        ${['¿Qué le falta a mi proyecto?', '¿Cómo calculo una escalera?', 'Dimensiones mínimas de un baño accesible', 'Diferencia entre índice de ocupación y de construcción', '¿Qué formato 3D es mejor para la web?']
          .map((s) => html`<button class="chip" data-suggest="${s}">${s}</button>`)}
      </div></div>`);

  async function loadConversation() {
    if (!activeId) { welcome(); return; }
    const msgs = await api.get(`/ai/conversations/${activeId}`);
    const conv = conversations.find((c) => c.id === activeId);
    if (conv?.projectId) { projectId = conv.projectId; $('#ctx-project', el).value = projectId; loadDocs(); }
    mount(box, html`${msgs.map(msgHtml)}`);
    box.scrollTop = box.scrollHeight;
  }

  async function loadDocs() {
    docs = projectId ? (await api.get(`/projects/${projectId}/documents`)).filter((d) => d.mediaType.startsWith('image/') || d.mediaType === 'application/pdf') : [];
  }

  const drawAttached = () => mount($('#attached', el), html`${attached.map((d) => html`<span class="chip">${icon('blueprint')}${d.name}<button class="btn ghost icon sm" data-detach="${d.id}" style="width:20px;height:20px">${icon('x')}</button></span>`)}`);

  async function send(text) {
    const message = text.trim();
    if (!message) return;
    input.value = '';
    input.style.height = '';
    if (!activeId) mount(box, '');
    box.insertAdjacentHTML('beforeend', msgHtml({ role: 'user', content: message }).s);
    box.insertAdjacentHTML('beforeend', html`<div class="msg" id="typing"><div class="who"><img src="/assets/mark-96.png" alt=""></div><div class="typing"><i></i><i></i><i></i></div></div>`.s);
    box.scrollTop = box.scrollHeight;
    try {
      const r = await api.post('/ai/chat', { conversationId: activeId, projectId: projectId || null, message, documentIds: attached.map((d) => d.id) });
      $('#typing', el)?.remove();
      box.insertAdjacentHTML('beforeend', msgHtml(r.message).s);
      box.scrollTop = box.scrollHeight;
      attached = [];
      drawAttached();
      if (!activeId) {
        activeId = r.conversationId;
        history.replaceState(null, '', `#/copilot/${activeId}`);
        const fresh = await api.get('/ai/conversations');
        conversations.splice(0, conversations.length, ...fresh);
        drawList();
      }
    } catch (e) {
      $('#typing', el)?.remove();
      box.insertAdjacentHTML('beforeend', html`<div class="msg"><div class="who">${icon('alert')}</div><div class="error-text">${e.message}</div></div>`.s);
    }
  }

  $('#composer', el).addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(220, input.scrollHeight)}px`; });
  on(el, 'click', '[data-suggest]', (e, b) => send(b.dataset.suggest));
  on(el, 'click', '[data-detach]', (e, b) => { attached = attached.filter((d) => d.id !== b.dataset.detach); drawAttached(); });
  $('#ctx-project', el).addEventListener('change', async (e) => { projectId = e.target.value || null; attached = []; drawAttached(); await loadDocs(); });
  $('#attach', el).onclick = async () => {
    if (!projectId) { alertBox('Elige primero un proyecto para adjuntar sus planos o fotos.'); return; }
    await loadDocs();
    if (!docs.length) { alertBox('Este proyecto no tiene planos en PDF o imagen.'); return; }
    const pick = document.createElement('div');
    pick.className = 'card drawer';
    pick.style.cssText = 'top:auto;bottom:120px;right:auto;left:50%;transform:translateX(-30%)';
    mount(pick, html`<div class="card-head"><h3>Adjuntar al mensaje</h3></div><div class="card-body stack">${docs.map((d) => html`<label class="check"><input type="checkbox" value="${d.id}" ${attached.some((a) => a.id === d.id) ? 'checked' : ''}> ${d.name}</label>`)}
      <button class="btn primary" data-ok>Listo</button>${!status.llm ? html`<p class="hint">Para que la IA "vea" los planos configura ANTHROPIC_API_KEY en el servidor.</p>` : ''}</div>`);
    document.body.appendChild(pick);
    pick.querySelector('[data-ok]').onclick = () => {
      attached = [...pick.querySelectorAll('input:checked')].map((i) => docs.find((d) => d.id === i.value));
      drawAttached();
      pick.remove();
    };
  };
  function alertBox(msg) {
    box.insertAdjacentHTML('beforeend', html`<div class="msg"><div class="who">${icon('info')}</div><div class="muted">${msg}</div></div>`.s);
    box.scrollTop = box.scrollHeight;
  }

  if (projectId) await loadDocs();
  await loadConversation();
  const draft = sessionStorage.getItem('civia-copilot-draft');
  if (draft) { sessionStorage.removeItem('civia-copilot-draft'); send(draft); }
}
