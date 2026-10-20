// CIVIA Copilot: chat con la IA de ingeniería civil y arquitectura, en tiempo real, con contexto de
// proyecto y archivos adjuntos.
import { api, stream } from '../api.js';
import { $, html, icon, markdown, mount, on, relTime, toast } from '../ui.js';

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
          <button class="btn primary icon" id="send" aria-label="Enviar">${icon('send')}</button>
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
    : html`<div class="msg ai" data-mid="${m.id || ''}"><div class="who"><img src="/assets/mark-96.png" alt=""></div><div>
        <div class="md">${markdown(m.content)}</div>
        ${sourcesHtml(m.sources)}
        ${m.suggestions?.length ? html`<div class="chips" style="margin-top:12px">${m.suggestions.map((s) => html`<button class="chip" data-suggest="${s}">${icon('sparkle')}${s}</button>`)}</div>` : ''}
        <div class="msg-actions">
          <button class="btn ghost icon sm" data-copy title="Copiar respuesta" aria-label="Copiar respuesta">${icon('copy')}</button>
          ${m.id ? html`<button class="btn ghost icon sm ${m.feedback === 1 ? 'on' : ''}" data-rate="up" title="Respuesta útil" aria-label="Respuesta útil" aria-pressed="${m.feedback === 1}">${icon('thumbup')}</button>
          <button class="btn ghost icon sm ${m.feedback === -1 ? 'on' : ''}" data-rate="down" title="No fue útil" aria-label="No fue útil" aria-pressed="${m.feedback === -1}">${icon('thumbdown')}</button>` : ''}
          <span class="hint engine-tag">${m.engine || ''}</span>
        </div></div></div>`);

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

  /** Respuesta en vivo: el texto aparece a medida que Claude lo escribe, con un cursor. */
  function liveReply() {
    const node = document.createElement('div');
    node.className = 'msg live';
    node.innerHTML = html`<div class="who"><img src="/assets/mark-96.png" alt=""></div>
      <div><div class="md"><div class="typing"><i></i><i></i><i></i></div></div></div>`.s;
    box.appendChild(node);
    const target = node.querySelector('.md');
    let text = '';
    let frame = 0;
    return {
      node,
      append(delta) {
        text += delta;
        frame ||= requestAnimationFrame(() => {
          frame = 0;
          target.innerHTML = markdown(text).s;
          // El cursor va al final del último bloque (párrafo, ítem o código), no en una línea aparte.
          let tail = target.lastElementChild;
          while (tail?.lastElementChild && /^(UL|OL|LI|PRE|TABLE|TBODY|TR|BLOCKQUOTE)$/.test(tail.lastElementChild.tagName)) tail = tail.lastElementChild;
          if (tail?.tagName === 'PRE') tail = tail.firstElementChild;
          (tail || target).insertAdjacentHTML('beforeend', '<span class="caret" aria-hidden="true"></span>');
          box.scrollTop = box.scrollHeight;
        });
      },
      get text() { return text; },
    };
  }

  let controller = null;
  const sendBtn = () => $('#send', el);
  function setStreaming(on) {
    const b = sendBtn();
    if (!b) return;
    b.innerHTML = icon(on ? 'stop' : 'send').s;
    b.setAttribute('aria-label', on ? 'Detener la respuesta' : 'Enviar');
    b.classList.toggle('stopping', on);
  }

  async function send(text) {
    const message = text.trim();
    if (!message || controller) return;
    input.value = '';
    input.style.height = '';
    if (!activeId) mount(box, '');
    box.insertAdjacentHTML('beforeend', msgHtml({ role: 'user', content: message }).s);
    box.scrollTop = box.scrollHeight;
    const body = { conversationId: activeId, projectId: projectId || null, message, documentIds: attached.map((d) => d.id) };
    const live = liveReply();
    let started = false;
    let saved = null;
    let failure = null;
    controller = new AbortController();
    setStreaming(true);
    try {
      if (status.streaming) {
        await stream('/ai/chat/stream', body, {
          signal: controller.signal,
          onEvent: (name, data) => {
            if (name === 'start') { started = true; activeId ||= data.conversationId; }
            else if (name === 'delta') live.append(data.text);
            else if (name === 'done') saved = data;
            else if (name === 'error') failure = data.message;
          },
        }).catch((e) => { if (started) throw e; });
      }
      // Sin streaming (o si no llegó a empezar): respuesta completa de una vez.
      if (!started) saved = await api.post('/ai/chat', body);
      if (failure) throw new Error(failure);
      live.node.remove();
      if (saved) {
        box.insertAdjacentHTML('beforeend', msgHtml(saved.message).s);
      } else {
        // La conexión se cortó: el servidor termina y guarda la respuesta; se recarga del historial.
        await loadConversation();
      }
      box.scrollTop = box.scrollHeight;
      attached = [];
      drawAttached();
      const id = saved?.conversationId || activeId;
      if (id && !location.hash.endsWith(id)) {
        activeId = id;
        history.replaceState(null, '', `#/copilot/${activeId}`);
      }
      const fresh = await api.get('/ai/conversations');
      conversations.splice(0, conversations.length, ...fresh);
      drawList();
    } catch (e) {
      if (e.name === 'AbortError') {
        // Detenida por la persona: se conserva lo escrito; el servidor guarda la respuesta completa.
        live.node.classList.add('stopped');
        live.node.querySelector('.caret')?.remove();
        live.node.lastElementChild.insertAdjacentHTML('beforeend', html`<div class="hint" style="margin-top:8px">Detenida. La respuesta completa queda en el historial.</div>`.s);
        return;
      }
      live.node.remove();
      box.insertAdjacentHTML('beforeend', html`<div class="msg"><div class="who">${icon('alert')}</div><div class="error-text">${e.message}</div></div>`.s);
    } finally {
      controller = null;
      setStreaming(false);
    }
  }

  $('#composer', el).addEventListener('submit', (e) => {
    e.preventDefault();
    if (controller) controller.abort();
    else send(input.value);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  const onEscape = (e) => { if (e.key === 'Escape' && controller) controller.abort(); };
  document.addEventListener('keydown', onEscape);
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(220, input.scrollHeight)}px`; });
  on(el, 'click', '[data-suggest]', (e, b) => send(b.dataset.suggest));
  on(el, 'click', '[data-rate]', async (e, b) => {
    const msg = b.closest('.msg');
    const value = b.classList.contains('on') ? null : b.dataset.rate;
    try {
      await api.post(`/ai/messages/${msg.dataset.mid}/feedback`, { value });
      msg.querySelectorAll('[data-rate]').forEach((x) => {
        const on = x.dataset.rate === value;
        x.classList.toggle('on', on);
        x.setAttribute('aria-pressed', String(on));
      });
      if (value) toast(value === 'up' ? 'Gracias: la respuesta te sirvió.' : 'Gracias: lo tendremos en cuenta para mejorar.', 'info');
    } catch (err) { toast(err.message, 'error'); }
  });
  on(el, 'click', '[data-copy]', async (e, b) => {
    const text = b.closest('.msg')?.querySelector('.md')?.innerText || '';
    try {
      await navigator.clipboard.writeText(text);
      b.classList.add('done');
      b.innerHTML = icon('check').s;
      setTimeout(() => { b.classList.remove('done'); b.innerHTML = icon('copy').s; }, 1600);
    } catch { toast('No se pudo copiar. Selecciona el texto y cópialo a mano.', 'error'); }
  });
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
  return () => { document.removeEventListener('keydown', onEscape); controller?.abort(); };
}
