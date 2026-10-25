// CIVIA AI — arranque, sesión, enrutador y estructura de la aplicación.
import { api, hasSessionHint, logout, refresh, server, session, wakeServer } from './api.js';
import { $, $$, avatar, esc, html, icon, mount, on, raw, relTime, toast } from './ui.js';
import { autoStagger, circularReveal, elevateOnScroll, enableRipples, enableSpotlight, leave, moveNavPill } from './motion.js';

const NAV = [
  { section: 'Estudio' },
  { href: '#/', icon: 'home', label: 'Inicio', match: /^#\/?$/ },
  { href: '#/projects', icon: 'projects', label: 'Proyectos', match: /^#\/projects/ },
  { href: '#/viewer', icon: 'cube', label: 'Modelado 3D', match: /^#\/(viewer|massing)/ },
  { href: '#/camera', icon: 'camera', label: 'Cámara', match: /^#\/camera/ },
  { section: 'Inteligencia' },
  { href: '#/copilot', icon: 'sparkle', label: 'CIVIA Copilot', match: /^#\/copilot/ },
  { href: '#/library', icon: 'book', label: 'Biblioteca', match: /^#\/library/ },
  { section: 'Cuenta' },
  { href: '#/profile', icon: 'shield', label: 'Perfil y seguridad', match: /^#\/profile/ },
];

const MOBILE = [
  { href: '#/', icon: 'home', label: 'Inicio', match: /^#\/?$/ },
  { href: '#/projects', icon: 'projects', label: 'Proyectos', match: /^#\/projects/ },
  { href: '#/camera', icon: 'camera', label: 'Cámara', match: /^#\/camera/ },
  { href: '#/copilot', icon: 'sparkle', label: 'Copilot', match: /^#\/copilot/ },
  { href: '#/library', icon: 'book', label: 'Biblioteca', match: /^#\/library/ },
];

const ROUTES = [
  [/^\/login$/, 'auth', { mode: 'login' }, true],
  [/^\/register$/, 'auth', { mode: 'register' }, true],
  [/^\/forgot$/, 'auth', { mode: 'forgot' }, true],
  // 'always': el enlace del correo funciona aunque haya una sesión abierta en este navegador.
  [/^\/reset$/, 'auth', { mode: 'reset' }, 'always'],
  [/^\/?$/, 'dashboard'],
  [/^\/projects$/, 'projects'],
  [/^\/projects\/([\w-]+)(?:\/(\w+))?$/, 'project', (m) => ({ id: m[1], tab: m[2] || 'overview' })],
  [/^\/viewer$/, 'viewer', {}],
  [/^\/viewer\/([\w-]+)$/, 'viewer', (m) => ({ docId: m[1] })],
  [/^\/massing\/([\w-]+)$/, 'viewer', (m) => ({ projectId: m[1], massing: true })],
  [/^\/camera(?:\/([\w-]+))?$/, 'camera', (m) => ({ projectId: m[1] })],
  [/^\/copilot(?:\/([\w-]+))?$/, 'copilot', (m) => ({ conversationId: m[1] })],
  [/^\/library$/, 'library', { view: 'home' }],
  [/^\/library\/c\/([\w-]+)$/, 'library', (m) => ({ view: 'category', id: m[1] })],
  [/^\/library\/a\/([\w-]+)$/, 'library', (m) => ({ view: 'article', slug: m[1] })],
  [/^\/library\/glossary$/, 'library', { view: 'glossary' }],
  [/^\/library\/favorites$/, 'library', { view: 'favorites' }],
  [/^\/library\/s\/(.+)$/, 'library', (m) => ({ view: 'search', q: decodeURIComponent(m[1]) })],
  [/^\/profile$/, 'profile'],
];

const app = document.getElementById('app');
let cleanup = null;
let shellReady = false;
let aiStatus = null;

// ------------------------------------------------------------------ tema
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  try { localStorage.setItem('civia-theme', document.documentElement.dataset.theme); } catch { /* modo privado */ }
}
try { applyTheme(localStorage.getItem('civia-theme') || 'dark'); } catch { applyTheme('dark'); }
export { applyTheme };

// ------------------------------------------------------------------ estructura
function backdrop() {
  return raw(`<div class="backdrop"><svg viewBox="0 0 400 300" fill="none" stroke="currentColor" stroke-width=".6" style="color:var(--text-3)">
    <path d="M40 280V120l120-60 120 60v160M160 60v220M40 120h240M40 170h240M40 220h240M100 90v190M220 90v190"/>
    <path d="M280 280V160l80-30v150M280 200h80M280 240h80" opacity=".6"/><path d="M0 280h400"/></svg></div>`);
}

function renderShell() {
  const u = session.user;
  mount(app, html`${backdrop()}
  <div class="shell">
    <aside class="sidebar" aria-label="Navegación">
      <a class="brand" href="#/">
        <img src="/assets/mark-96.png" alt="" width="40" height="40">
        <div><div class="name chrome-text">Civia <b class="ai-text">AI</b></div><div class="tag">Arquitectura inteligente</div></div>
      </a>
      <nav class="nav">
        ${NAV.map((n) => (n.section
          ? html`<div class="eyebrow nav-section">${n.section}</div>`
          : html`<a href="${n.href}" data-nav="${n.match.source}">${icon(n.icon)}<span>${n.label}</span></a>`))}
      </nav>
      <div class="foot">
        <div class="engine" id="engine"><i></i><span>Motor de IA…</span></div>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <label class="search" for="global-search">${icon('search')}
          <input id="global-search" placeholder="Busca en la biblioteca o pregunta algo de ingeniería…" autocomplete="off">
          <kbd>/</kbd></label>
        <div class="spacer"></div>
        <button class="btn ghost icon" id="theme-toggle" aria-label="Cambiar tema">${icon(document.documentElement.dataset.theme === 'light' ? 'moon' : 'sun')}</button>
        <button class="btn ghost icon rel" id="notif-btn" aria-label="Notificaciones">${icon('bell')}<span class="badge-count" id="notif-count" hidden></span></button>
        <a href="#/profile" class="row" aria-label="Perfil">${avatar(u.fullName, u.avatarColor)}</a>
        <button class="btn ghost icon" id="logout" aria-label="Cerrar sesión" title="Cerrar sesión">${icon('logout')}</button>
      </header>
      <main class="content" id="view"></main>
    </div>
  </div>
  <nav class="mobile-nav" aria-label="Navegación móvil">
    ${MOBILE.map((n) => html`<a href="${n.href}" data-nav="${n.match.source}">${icon(n.icon)}<span>${n.label}</span></a>`)}
  </nav>`);

  $('#logout').onclick = async () => { await logout(); location.hash = '#/login'; };
  $('#theme-toggle').onclick = () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    circularReveal($('#theme-toggle'), () => {
      applyTheme(next);
      $('#theme-toggle').innerHTML = icon(next === 'light' ? 'moon' : 'sun').s;
    });
    api.patch('/auth/user', { preferences: { theme: next } }).catch(() => {});
  };
  const search = $('#global-search');
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && search.value.trim()) {
      location.hash = `#/library/s/${encodeURIComponent(search.value.trim())}`;
      search.blur();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
      e.preventDefault();
      $('#global-search')?.focus();
    }
  });
  $('#notif-btn').onclick = toggleNotifications;
  shellReady = true;
  autoStagger($('#view'));
  elevateOnScroll($('.topbar'));
  loadEngine();
  refreshNotifications();
}

async function loadEngine() {
  try {
    aiStatus ||= await api.get('/ai/status');
    const el = $('#engine');
    if (el) mount(el, html`<i></i><span>${aiStatus.llm ? aiStatus.engine : 'Motor local de CIVIA'}</span>`);
  } catch { /* sin conexión */ }
}

async function refreshNotifications() {
  try {
    const n = await api.get('/notifications');
    const badge = $('#notif-count');
    if (badge) { badge.hidden = !n.unread; badge.textContent = n.unread > 9 ? '9+' : n.unread; }
    return n;
  } catch { return null; }
}

let drawer = null;
/** Cierra el panel de notificaciones con su animación de salida. */
function closeDrawer() {
  if (!drawer) return;
  const d = drawer;
  drawer = null;
  d.classList.add('closing');
  setTimeout(() => d.remove(), 180);
}
async function toggleNotifications() {
  if (drawer) { closeDrawer(); return; }
  drawer = document.createElement('div');
  drawer.className = 'card drawer';
  drawer.innerHTML = '<div class="card-body"><div class="skeleton" style="height:120px"></div></div>';
  document.body.appendChild(drawer);
  const n = await refreshNotifications();
  if (!drawer || !n) return;
  mount(drawer, html`<div class="card-head"><h3>Notificaciones</h3>
      <button class="btn sm ghost" id="read-all">Marcar todo como leído</button></div>
    ${n.items.length ? n.items.map((x) => html`<div class="notif ${x.read ? '' : 'unread'}" data-id="${x.id}" data-link="${x.link || ''}">
        <i></i><div><b>${x.title}</b><p>${x.body}</p><div class="hint" style="margin-top:4px">${relTime(x.createdAt)}</div></div></div>`)
      : html`<div class="empty">${icon('bell', 'big')}<p>No tienes notificaciones.</p></div>`}`);
  on(drawer, 'click', '.notif', async (e, el) => {
    api.post(`/notifications/${el.dataset.id}/read`).catch(() => {});
    if (el.dataset.link?.startsWith('#/')) location.hash = el.dataset.link;
    drawer?.remove(); drawer = null; refreshNotifications();
  });
  $('#read-all', drawer).onclick = async () => { await api.post('/notifications/read-all'); drawer?.remove(); drawer = null; refreshNotifications(); };
}
document.addEventListener('mousedown', (e) => {
  if (drawer && !drawer.contains(e.target) && !e.target.closest('#notif-btn')) closeDrawer();
});

// ------------------------------------------------------------------ enrutador
const viewModules = {};
const loadView = (name) => (viewModules[name] ||= import(`./views/${name}.js`));

let navSeq = 0;

async function route() {
  const seq = ++navSeq;
  const hash = location.hash || '#/';
  const [path, queryString] = (hash.slice(1) || '/').split('?');
  let match = null;
  for (const [re, view, params, isPublic] of ROUTES) {
    const m = path.match(re);
    if (m) {
      const p = typeof params === 'function' ? params(m) : { ...(params || {}) };
      p.query = new URLSearchParams(queryString || '');
      match = { view, params: p, isPublic };
      break;
    }
  }
  if (!match) { location.hash = '#/'; return; }

  if (!session.user && !match.isPublic) {
    sessionStorage.setItem('civia-after-login', hash);
    location.hash = '#/login';
    return;
  }
  if (session.user && match.isPublic === true) { location.hash = '#/'; return; }

  if (typeof cleanup === 'function') { try { cleanup(); } catch { /* vista ya desmontada */ } }
  cleanup = null;
  if (drawer) { drawer.remove(); drawer = null; }

  let target;
  if (match.isPublic) {
    shellReady = false;
    target = app;
  } else {
    if (shellReady) {
      await leave($('#view'));
      // Si mientras tanto se pidió otra sección, esta navegación ya no aplica.
      if (seq !== navSeq) return;
    } else renderShell();
    target = $('#view');
    target.classList.remove('leaving');
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', new RegExp(a.dataset.nav).test(hash)));
    moveNavPill($('.sidebar .nav'));
    target.style.animation = 'none';
    void target.offsetWidth;
    target.style.animation = '';
  }
  // Si la sección tarda, se muestra un esqueleto en lugar de una pantalla vacía.
  const skeleton = match.isPublic ? 0 : setTimeout(() => {
    if (seq === navSeq) mount(target, html`<div class="view-skeleton" aria-busy="true"><div class="skeleton sk-title"></div>
      <div class="sk-row">${Array.from({ length: 4 }, () => html`<div class="skeleton sk-card"></div>`)}</div></div>`);
  }, 160);
  try {
    const mod = await loadView(match.view);
    clearTimeout(skeleton); // la vista ya puede pintarse: el esqueleto no debe pisarla
    if (target === $('#view') || match.isPublic) {
      cleanup = await mod.render(target, match.params, { refreshNotifications, aiStatus: () => aiStatus });
      restoreDrafts(target);
    }
  } catch (e) {
    console.error(e);
    mount(target, html`<div class="empty">${icon('alert', 'big')}<h3>No se pudo cargar esta sección</h3><p>${e.message || ''}</p>
      <button class="btn" id="retry-view">Reintentar</button></div>`);
    $('#retry-view', target)?.addEventListener('click', route);
  }
  clearTimeout(skeleton);
  window.scrollTo({ top: 0, behavior: 'instant' }); // una sección nueva empieza arriba, sin desplazamiento animado
  hideSplash();
}

function hideSplash() {
  const s = document.getElementById('splash');
  if (s && !s.classList.contains('out')) {
    s.classList.add('out');
    setTimeout(() => s.remove(), 500);
  }
}

session.onChange((user) => {
  if (!user && shellReady) {
    shellReady = false;
    location.hash = '#/login';
  }
  if (user?.preferences?.theme) applyTheme(user.preferences.theme);
});

export function afterLogin() {
  const next = sessionStorage.getItem('civia-after-login');
  sessionStorage.removeItem('civia-after-login');
  // La intro se muestra al entrar con la cuenta (no al recargar) mientras la sección carga detrás.
  import('./intro.js').then(({ playIntro }) => playIntro(session.user)).catch(() => {});
  location.hash = next && !next.includes('login') ? next : '#/';
}

// Copiar bloques de código de cualquier respuesta o artículo.
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-code-copy]');
  if (!b) return;
  try {
    await navigator.clipboard.writeText(b.parentElement.querySelector('code')?.innerText || '');
    b.textContent = 'Copiado';
    b.classList.add('done');
    setTimeout(() => { b.textContent = 'Copiar'; b.classList.remove('done'); }, 1500);
  } catch { toast('No se pudo copiar el código.', 'error'); }
});

// ------------------------------------------------------------------ arranque
enableRipples();
enableSpotlight();
window.addEventListener('hashchange', route);
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.status && e.reason.status !== 401) toast(e.reason.message, 'error');
});

// ------------------------------------------------------------------ actualizaciones al instante
// Una versión nueva se descarga en segundo plano y aparece el aviso «Actualizar»: al pulsarlo se
// activa y la página se recarga (los formularios abiertos se guardan antes como borrador).
let reloading = false;
function showUpdate(reg) {
  if ($('.update-banner')) return;
  const bar = document.createElement('div');
  bar.className = 'update-banner';
  bar.setAttribute('role', 'status');
  bar.innerHTML = `<span class="update-ico" aria-hidden="true">${icon('refresh').s}</span>
    <div><b>Nueva versión de CIVIA lista</b><span>Actualiza para ver las mejoras. No pierdes lo que estás haciendo.</span></div>
    <button type="button" class="btn sm ghost" data-later>Después</button>
    <button type="button" class="btn sm primary" data-update>Actualizar ahora</button>`;
  document.body.append(bar);
  bar.querySelector('[data-later]').onclick = () => bar.remove();
  bar.querySelector('[data-update]').onclick = () => {
    saveDrafts();
    reg.waiting?.postMessage({ type: 'skip-waiting' });
  };
}

/** Guarda lo escrito en formularios abiertos para recuperarlo tras recargar. */
function saveDrafts() {
  try {
    const drafts = {};
    document.querySelectorAll('textarea[id], input[id]:not([type=password]):not([type=hidden]):not([type=file])').forEach((i) => {
      if (i.value && i.closest('form')) drafts[i.id] = i.value;
    });
    sessionStorage.setItem('civia-drafts', JSON.stringify({ hash: location.hash, drafts }));
  } catch { /* sin almacenamiento */ }
}

/** Tras actualizar, devuelve lo escrito a los campos de la misma sección. */
export function restoreDrafts(root) {
  try {
    const saved = JSON.parse(sessionStorage.getItem('civia-drafts') || 'null');
    if (!saved || saved.hash !== location.hash) return;
    sessionStorage.removeItem('civia-drafts');
    Object.entries(saved.drafts).forEach(([id, v]) => { const i = root.querySelector(`#${CSS.escape(id)}`); if (i && !i.value) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } });
  } catch { /* nada que restaurar */ }
}

async function watchUpdates() {
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const track = (w) => w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(reg); });
    if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg);
    track(reg.installing);
    reg.addEventListener('updatefound', () => track(reg.installing));
    // Solo se recarga al reemplazar una versión anterior (no en la primera visita, cuando el worker toma el control).
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloading) { reloading = true; location.reload(); } });
    // Busca versiones nuevas al volver a la pestaña y cada 30 minutos.
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    setInterval(() => reg.update().catch(() => {}), 30 * 60_000);
  } catch { /* sin service worker: la app funciona igual */ }
}

// Aviso mientras la API despierta (plan gratuito de Render: tarda unos minutos tras dormir).
const wakeBanner = document.createElement('div');
wakeBanner.className = 'wake-banner';
wakeBanner.setAttribute('role', 'status');
wakeBanner.setAttribute('aria-live', 'polite');
wakeBanner.hidden = true;
wakeBanner.innerHTML = '<span class="wake-dot" aria-hidden="true"></span>'
  + '<span>Despertando el servidor de CIVIA… puede tardar hasta 3 minutos. Tu sesión y tus datos están a salvo.</span>';
document.body.append(wakeBanner);
server.onChange((on) => { wakeBanner.hidden = !on; });

(async () => {
  // Despertar la API apenas abre la página: mientras la persona escribe, el servidor ya arranca.
  wakeServer();
  // Restaurar la sesión con la cookie segura (una sola petición) solo si hubo sesión antes.
  if (hasSessionHint()) await refresh();
  route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') watchUpdates();
})();

export { esc };
