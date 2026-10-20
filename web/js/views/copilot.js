// CIVIA Copilot: chat con la IA de ingeniería civil y arquitectura, en tiempo real, con contexto de
// proyecto y archivos adjuntos.
import { api, downloadPath, stream } from '../api.js';
import { $, confirmDialog, debounce, html, icon, markdown, modal, mount, on, relTime, toast } from '../ui.js';

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
        <div class="row" style="gap:4px"><button class="btn ghost icon sm" id="clear-all" title="Borrar todo el historial" aria-label="Borrar todo el historial">${icon('trash')}</button>
        <a class="btn sm primary" href="#/copilot">${icon('plus')} Nueva</a></div></div>
      <label class="search conv-search" for="conv-q">${icon('search')}<input id="conv-q" placeholder="Buscar en el historial" autocomplete="off"></label>
      <div class="list" id="conv-list"></div>
    </div>
    <div class="card thread">
      <div class="card-head" style="padding:12px 18px">
        <div class="row" style="min-width:0">
          <button class="btn ghost icon sm history-toggle" id="history-toggle" aria-label="Ver conversaciones" aria-expanded="false">${icon('history')}</button>
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

  let shown = conversations;
  let searching = '';
  const drawList = () => mount(list, shown.length
    ? html`${shown.map((c) => html`<div class="conv-row ${c.pinned ? 'pinned' : ''}">
        <a class="conv ${c.id === activeId ? 'active' : ''}" href="#/copilot/${c.id}" title="${c.title}">
        ${c.pinned ? icon('bookmark', 'pin-ico') : ''}${c.title}<div class="hint" style="font-size:11px">${c.projectName ? `${c.projectName} · ` : ''}${relTime(c.updatedAt)}</div></a>
        <button class="btn ghost icon sm conv-more" data-conv-menu="${c.id}" aria-label="Opciones de la conversación">${icon('sliders')}</button></div>`)}`
    : html`<p class="hint" style="padding:12px">${searching ? 'Ninguna conversación coincide.' : 'Tus conversaciones aparecerán aquí.'}</p>`);
  drawList();
  /** Menú de una conversación: renombrar y fijar. */
  let menu = null;
  const closeMenu = () => { menu?.remove(); menu = null; };
  const updateConversation = async (id, change) => {
    const updated = await api.patch(`/ai/conversations/${id}`, change);
    const fresh = await api.get('/ai/conversations');
    conversations.splice(0, conversations.length, ...fresh);
    if (!searching) shown = conversations;
    else shown = shown.map((c) => (c.id === id ? updated : c));
    drawList();
  };
  on(list, 'click', '[data-conv-menu]', (e, b) => {
    e.preventDefault();
    const id = b.dataset.convMenu;
    const c = shown.find((x) => x.id === id);
    if (!c) return;
    closeMenu();
    menu = document.createElement('div');
    menu.className = 'card menu';
    menu.setAttribute('role', 'menu');
    mount(menu, html`<button role="menuitem" data-act="rename">${icon('edit')} Renombrar</button>
      <button role="menuitem" data-act="pin">${icon('bookmark')} ${c.pinned ? 'Quitar de fijadas' : 'Fijar arriba'}</button>
      <button role="menuitem" data-act="export">${icon('download')} Exportar (Markdown)</button>
      <button role="menuitem" data-act="delete" class="danger">${icon('trash')} Borrar</button>`);
    document.body.appendChild(menu);
    const r = b.getBoundingClientRect();
    menu.style.top = `${Math.min(r.bottom + 6, innerHeight - menu.offsetHeight - 12)}px`;
    menu.style.left = `${Math.max(12, r.right - menu.offsetWidth)}px`;
    on(menu, 'click', '[data-act]', async (ev, item) => {
      closeMenu();
      try {
        if (item.dataset.act === 'rename') {
          const m = modal({
            title: 'Renombrar conversación',
            body: html`<form id="rename-form"><div class="field"><label for="conv-title">Nombre</label>
              <input class="input" id="conv-title" name="title" maxlength="120" value="${c.title}" required></div></form>`,
            foot: html`<button class="btn ghost" data-cancel>Cancelar</button><button class="btn primary" data-save>Guardar</button>`,
          });
          const save = async (ev2) => {
            ev2?.preventDefault();
            const title = $('#conv-title', m.el).value.trim();
            if (!title) return;
            m.close();
            if (title !== c.title) await updateConversation(id, { title });
          };
          m.el.querySelector('[data-cancel]').onclick = m.close;
          m.el.querySelector('[data-save]').onclick = save;
          $('#rename-form', m.el).addEventListener('submit', save);
          setTimeout(() => $('#conv-title', m.el)?.select(), 60);
        } else if (item.dataset.act === 'pin') {
          await updateConversation(id, { pinned: !c.pinned });
        } else if (item.dataset.act === 'export') {
          const name = `${(c.title || 'conversacion').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'conversacion'}.md`;
          await downloadPath(`/ai/conversations/${id}/export`, name);
        } else if (item.dataset.act === 'delete') {
          if (!(await confirmDialog('Borrar conversación', `Se borrará «${c.title}» y sus mensajes. No se puede deshacer.`, 'Borrar', true))) return;
          await api.del(`/ai/conversations/${id}`);
          conversations.splice(conversations.findIndex((x) => x.id === id), 1);
          shown = shown.filter((x) => x.id !== id);
          drawList();
          if (id === activeId) location.hash = '#/copilot';
          toast('Conversación borrada');
        }
      } catch (err) { toast(err.message, 'error'); }
    });
  });
  const outside = (e) => { if (menu && !menu.contains(e.target) && !e.target.closest('[data-conv-menu]')) closeMenu(); };
  document.addEventListener('mousedown', outside);

  // En pantallas pequeñas la lista se abre como panel sobre el chat.
  const chat = $('.chat', el);
  const toggleHistory = (open = !chat.classList.contains('show-list')) => {
    chat.classList.toggle('show-list', open);
    $('#history-toggle', el).setAttribute('aria-expanded', String(open));
  };
  $('#history-toggle', el).onclick = () => toggleHistory();
  on(list, 'click', 'a.conv', () => toggleHistory(false));

  $('#clear-all', el).onclick = async () => {
    if (!conversations.length) return;
    if (!(await confirmDialog('Borrar todo el historial', `Se borrarán tus ${conversations.length} conversaciones con el Copilot. No se puede deshacer.`, 'Borrar todo', true))) return;
    const r = await api.del('/ai/conversations');
    conversations.splice(0);
    shown = conversations;
    drawList();
    toast(`${r.deleted} conversaciones borradas`);
    if (activeId) location.hash = '#/copilot';
  };

  $('#conv-q', el).addEventListener('input', debounce(async (e) => {
    searching = e.target.value.trim();
    shown = searching ? await api.get(`/ai/conversations?q=${encodeURIComponent(searching)}`) : conversations;
    drawList();
  }, 250));

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
          ${m.id ? html`<button class="btn ghost icon sm regen" data-regen title="Responder de nuevo" aria-label="Responder de nuevo">${icon('refresh')}</button>` : ''}
          <span class="hint engine-tag">${m.engine || ''}</span>
        </div></div></div>`);

  const FALLBACK = ['¿Qué le falta a mi proyecto?', '¿Cómo predimensiono una viga de concreto?', 'Explícame la licuación de suelos',
    'Caudal de diseño con el método racional', 'Diferencias entre pavimento rígido y flexible'];
  const welcome = () => {
    mount(box, html`<div class="empty welcome" style="margin:auto">
      <img src="/assets/mark-256.png" alt="" width="120" height="120">
      <h2 class="display" style="font-size:30px">¿En qué <span class="chrome-text">trabajamos</span> hoy?</h2>
      <p>Pregunta lo que necesites: estructuras, geotecnia, hidráulica, vías, presupuestos, normativa o cualquier otro tema. Elige un proyecto para que CIVIA conozca su contexto y te diga qué le falta.</p>
      <div class="chips" id="suggested" style="justify-content:center">
        ${FALLBACK.map((s) => html`<button class="chip" data-suggest="${s}">${s}</button>`)}
      </div></div>`);
    // Sugerencias según el estado del proyecto elegido (si la API no responde, quedan las generales).
    api.get(`/ai/suggestions${projectId ? `?projectId=${projectId}` : ''}`).then((list) => {
      const target = $('#suggested', box);
      if (target && list?.length) mount(target, html`${list.map((s) => html`<button class="chip" data-suggest="${s}">${s}</button>`)}`);
    }).catch(() => {});
  };

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
      if (!searching) shown = conversations;
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

  /** Nueva respuesta para la última pregunta (reemplaza la última respuesta). */
  async function regenerate() {
    if (!activeId || controller) return;
    [...box.querySelectorAll('.msg.ai')].pop()?.remove();
    const live = liveReply();
    let saved = null;
    let failure = null;
    controller = new AbortController();
    setStreaming(true);
    try {
      await stream(`/ai/conversations/${activeId}/regenerate`, {}, {
        signal: controller.signal,
        onEvent: (name, data) => {
          if (name === 'delta') live.append(data.text);
          else if (name === 'done') saved = data;
          else if (name === 'error') failure = data.message;
        },
      });
      if (failure) throw new Error(failure);
      live.node.remove();
      if (saved) box.insertAdjacentHTML('beforeend', msgHtml(saved.message).s);
      else await loadConversation();
      box.scrollTop = box.scrollHeight;
    } catch (e) {
      if (e.name === 'AbortError') { live.node.classList.add('stopped'); live.node.querySelector('.caret')?.remove(); return; }
      live.node.remove();
      box.insertAdjacentHTML('beforeend', html`<div class="msg"><div class="who">${icon('alert')}</div><div class="error-text">${e.message}</div></div>`.s);
    } finally {
      controller = null;
      setStreaming(false);
    }
  }
  on(el, 'click', '[data-regen]', () => regenerate());

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
  $('#ctx-project', el).addEventListener('change', async (e) => {
    projectId = e.target.value || null;
    attached = [];
    drawAttached();
    if (!activeId) welcome();
    await loadDocs();
  });
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
  return () => {
    document.removeEventListener('keydown', onEscape);
    document.removeEventListener('mousedown', outside);
    closeMenu();
    controller?.abort();
  };
}
