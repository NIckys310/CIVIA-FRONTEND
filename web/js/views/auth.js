// Inicio de sesión, registro y recuperación de contraseña (CIVIA Auth).
import { afterLogin } from '../app.js';
import { api, login, logout, register, session } from '../api.js';
import { $, busy, debounce, html, icon, mount, raw, toast } from '../ui.js';
import { stagger } from '../motion.js';
import { live, passwordChecks, rules, validateAll } from '../validate.js';

function strength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-záéíóúñ]/.test(pw) && /[A-ZÁÉÍÓÚÑ]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^\p{L}\d]/u.test(pw)) s++;
  return Math.min(4, Math.max(1, s));
}

/** Campo con ícono a la izquierda, estado (✓ / !) a la derecha y mensaje de validación debajo. */
const textField = (id, label, { type = 'text', autocomplete = 'off', ic = 'user', placeholder = '', required = false, extra = '' } = {}) => html`
  <div class="field" data-field="${id}">
    <label for="${id}">${label}</label>
    <div class="input-wrap">${icon(ic, 'lead')}
      <input class="input" id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}" placeholder="${placeholder}" ${required ? 'required' : ''} aria-describedby="${id}-msg">
      <span class="state" aria-hidden="true"></span>
    </div>
    <div class="field-msg" id="${id}-msg" aria-live="polite"></div>
    ${extra}
  </div>`;

const passwordField = (id, label, autocomplete, hint) => html`
  <div class="field" data-field="${id}">
    <label for="${id}">${label}</label>
    <div class="input-wrap pw">${icon('lock', 'lead')}
      <input class="input" id="${id}" name="${id}" type="password" autocomplete="${autocomplete}" required aria-describedby="${id}-msg">
      <span class="state" aria-hidden="true"></span>
      <button type="button" class="btn ghost icon sm" data-toggle="${id}" aria-label="Mostrar contraseña">${icon('eye')}</button>
    </div>
    <div class="field-msg" id="${id}-msg" aria-live="polite"></div>
    <div class="caps" id="${id}-caps" hidden>${icon('alert')} Bloq Mayús está activado</div>
    ${hint}
  </div>`;

const strengthHint = () => html`
  <div class="strength" id="strength"><i></i><i></i><i></i><i></i></div>
  <ul class="pw-checks" id="pw-checks">${passwordChecks('', 8).map((c) => html`<li data-check="${c.id}">${c.label}</li>`)}</ul>
  <div class="hint" id="pw-hint">Sin límite máximo: puedes usar una frase larga.</div>`;

const footer = html`<div class="ruled eyebrow" style="margin-top:34px;font-size:9px">Protegido por CIVIA Auth</div>`;

/**
 * Escena de arquitectura animada (en bucle de 14 s): plano del lote que se dibuja, torre isométrica
 * que sube piso a piso, ventanas que se encienden, grúa que gira, sol y barrido de luz, cotas y
 * etiquetas de plano. Todo es SVG y CSS: liviano, sin librerías y respetando «reducir movimiento».
 */
function architectureScene() {
  const s = 21; const cx = 300; const cy = 300;
  const P = (x, y, z) => [cx + (x - y) * 0.866 * s, cy + (x + y) * 0.5 * s - z * s];
  const pts = (...a) => a.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
  const floors = 16; const fh = 0.82; const gap = 0.12;
  const [x0, x1, y0, y1] = [0, 4, 0, 4];
  const cycle = 14;
  let keyframes = '';
  let tower = '';
  for (let i = 0; i < floors; i++) {
    const za = i * fh; const zb = za + fh - gap;
    const at = 10 + i * 3.1; // % del ciclo en que aparece este piso
    keyframes += `@keyframes cf${i}{0%,${(at - 0.1).toFixed(1)}%{opacity:0;transform:translateY(-16px)}${(at + 3.5).toFixed(1)}%,86%{opacity:1;transform:none}95%,100%{opacity:0;transform:none}}`;
    let win = '';
    for (let k = 0; k < 3; k++) {
      const a = x0 + 0.5 + k * 1.15; const b = a + 0.6;
      const d = ((i * 7 + k * 3) % 11) * 0.37;
      win += `<polygon class="win" style="animation-delay:${d.toFixed(2)}s" points="${pts(P(a, y1, za + 0.18), P(b, y1, za + 0.18), P(b, y1, zb - 0.12), P(a, y1, zb - 0.12))}"/>`;
      const c = y1 - 0.5 - k * 1.15; const e = c - 0.6;
      win += `<polygon class="win r" style="animation-delay:${(d + 1.3).toFixed(2)}s" points="${pts(P(x1, c, za + 0.18), P(x1, e, za + 0.18), P(x1, e, zb - 0.12), P(x1, c, zb - 0.12))}"/>`;
    }
    tower += `<g class="floor" style="animation:cf${i} ${cycle}s cubic-bezier(.16,1,.3,1) infinite">
      <polygon class="face l" points="${pts(P(x0, y1, za), P(x1, y1, za), P(x1, y1, zb), P(x0, y1, zb))}"/>
      <polygon class="face r" points="${pts(P(x1, y1, za), P(x1, y0, za), P(x1, y0, zb), P(x1, y1, zb))}"/>
      <polyline class="slab" points="${pts(P(x0, y1, zb), P(x1, y1, zb), P(x1, y0, zb))}"/>${win}</g>`;
  }
  const H = floors * fh;
  keyframes += `@keyframes croof{0%,${(10 + floors * 3.1).toFixed(1)}%{opacity:0;transform:translateY(-16px)}${(14 + floors * 3.1).toFixed(1)}%,86%{opacity:1;transform:none}95%,100%{opacity:0}}`;
  const roof = `<polygon class="roof" style="animation:croof ${cycle}s cubic-bezier(.16,1,.3,1) infinite" points="${pts(P(x0, y0, H), P(x1, y0, H), P(x1, y1, H), P(x0, y1, H))}"/>`;

  // Edificios vecinos (fijos) con ventanas que parpadean.
  const block = (bx0, bx1, by0, by1, n, cls) => {
    const h = n * fh; let w = '';
    for (let i = 0; i < n; i++) {
      const z = i * fh + 0.2;
      w += `<polygon class="win dim" style="animation-delay:${((i * 5 + bx0 * 3) % 9 * 0.45).toFixed(2)}s" points="${pts(P(bx0 + 0.4, by1, z), P(bx1 - 0.4, by1, z), P(bx1 - 0.4, by1, z + 0.4), P(bx0 + 0.4, by1, z + 0.4))}"/>`;
    }
    return `<g class="${cls}"><polygon class="face l dim" points="${pts(P(bx0, by1, 0), P(bx1, by1, 0), P(bx1, by1, h), P(bx0, by1, h))}"/>
      <polygon class="face r dim" points="${pts(P(bx1, by1, 0), P(bx1, by0, 0), P(bx1, by0, h), P(bx1, by1, h))}"/>
      <polygon class="roof dim" points="${pts(P(bx0, by0, h), P(bx1, by0, h), P(bx1, by1, h), P(bx0, by1, h))}"/>${w}</g>`;
  };

  // Retícula isométrica del suelo y lote.
  let grid = '';
  for (let g = -6; g <= 10; g += 2) {
    grid += `<line x1="${P(g, -6, 0)[0]}" y1="${P(g, -6, 0)[1]}" x2="${P(g, 10, 0)[0]}" y2="${P(g, 10, 0)[1]}"/>`;
    grid += `<line x1="${P(-6, g, 0)[0]}" y1="${P(-6, g, 0)[1]}" x2="${P(10, g, 0)[0]}" y2="${P(10, g, 0)[1]}"/>`;
  }
  const lot = pts(P(-1, -1, 0), P(5, -1, 0), P(5, 5, 0), P(-1, 5, 0), P(-1, -1, 0));

  // Grúa: mástil fijo y pluma que gira sobre su punta.
  const mBase = P(6.5, -1.5, 0); const mTop = P(6.5, -1.5, H + 3.2);
  const crane = `<g class="crane"><line class="mast" x1="${mBase[0]}" y1="${mBase[1]}" x2="${mTop[0]}" y2="${mTop[1]}"/>
    ${Array.from({ length: 9 }, (_, k) => { const a = P(6.5, -1.5, k * (H + 3.2) / 9); const b = P(6.5, -1.5, (k + 1) * (H + 3.2) / 9); return `<line class="lattice" x1="${a[0] - 4}" y1="${a[1]}" x2="${b[0] + 4}" y2="${b[1]}"/>`; }).join('')}
    <g class="jib" style="transform-origin:${mTop[0].toFixed(1)}px ${mTop[1].toFixed(1)}px">
      <line class="mast" x1="${mTop[0] + 46}" y1="${mTop[1]}" x2="${mTop[0] - 170}" y2="${mTop[1]}"/>
      <line class="lattice" x1="${mTop[0]}" y1="${mTop[1] - 22}" x2="${mTop[0] - 170}" y2="${mTop[1]}"/>
      <line class="lattice" x1="${mTop[0]}" y1="${mTop[1] - 22}" x2="${mTop[0] + 46}" y2="${mTop[1]}"/>
      <rect class="counter" x="${mTop[0] + 30}" y="${mTop[1]}" width="16" height="9"/>
      <g class="hook" style="transform-origin:${(mTop[0] - 120).toFixed(1)}px ${mTop[1].toFixed(1)}px"><line class="cable" x1="${mTop[0] - 120}" y1="${mTop[1]}" x2="${mTop[0] - 120}" y2="${mTop[1] + 70}"/><rect class="load" x="${mTop[0] - 132}" y="${mTop[1] + 70}" width="24" height="8"/></g>
    </g></g>`;

  // Cotas de altura y etiquetas de plano.
  const d0 = P(x0 - 1.4, y1 + 1.4, 0); const d1 = P(x0 - 1.4, y1 + 1.4, H);
  const tag = (x, y, text, delay) => `<g class="tag" style="animation-delay:${delay}s"><rect x="${x}" y="${y - 13}" width="${text.length * 6.2 + 16}" height="20" rx="6"/><text x="${x + 8}" y="${y + 1}">${text}</text></g>`;

  return raw(`<svg class="auth-scene" viewBox="0 0 600 600" aria-hidden="true">
    <defs>
      <style>${keyframes}</style>
      <radialGradient id="as-sun"><stop offset="0" stop-color="#ffe2bb"/><stop offset=".4" stop-color="#d6a46c" stop-opacity=".5"/><stop offset="1" stop-color="#d6a46c" stop-opacity="0"/></radialGradient>
      <linearGradient id="as-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8d4ea" stop-opacity=".55"/><stop offset="1" stop-color="#5b75a6" stop-opacity=".3"/></linearGradient>
      <linearGradient id="as-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d90b4" stop-opacity=".55"/><stop offset="1" stop-color="#2c3a57" stop-opacity=".45"/></linearGradient>
      <linearGradient id="as-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2cf9f" stop-opacity="0"/><stop offset=".5" stop-color="#f2cf9f" stop-opacity=".16"/><stop offset="1" stop-color="#f2cf9f" stop-opacity="0"/></linearGradient>
    </defs>
    <g class="sun"><circle cx="500" cy="96" r="80" fill="url(#as-sun)"/><circle cx="500" cy="96" r="18" fill="#ffe8c7"/></g>
    <g class="ground">${grid}</g>
    <polyline class="lot" pathLength="1" points="${lot}"/>
    ${block(-6, -3, 1, 4, 5, 'nb a')}
    ${block(6, 9, 2, 5, 8, 'nb b')}
    ${block(-2, 1, 6, 8.5, 3, 'nb c')}
    <g class="tower">${tower}${roof}</g>
    ${crane}
    <g class="dim-line"><line x1="${d0[0]}" y1="${d0[1]}" x2="${d1[0]}" y2="${d1[1]}" pathLength="1"/>
      <line x1="${d0[0] - 6}" y1="${d0[1]}" x2="${d0[0] + 6}" y2="${d0[1]}"/><line x1="${d1[0] - 6}" y1="${d1[1]}" x2="${d1[0] + 6}" y2="${d1[1]}"/></g>
    ${tag(d1[0] - 96, (d0[1] + d1[1]) / 2, '16 PISOS · 46,4 m', 7)}
    ${tag(P(x1, y0, H)[0] + 14, P(x1, y0, H)[1] - 6, 'N16 · CUBIERTA', 9.5)}
    ${tag(P(5, 5, 0)[0] + 10, P(5, 5, 0)[1] + 8, 'LOTE 600 m² · IO 0,6', 3)}
    <polygon class="beam" points="0,0 120,0 40,600 -80,600" fill="url(#as-beam)"/>
  </svg>`);
}

/** Estructura común de las pantallas de acceso: escena de arquitectura y panel con el formulario. */
function layout(el, panel) {
  mount(el, html`
  <div class="auth">
    <section class="hero" aria-hidden="true">
      <div class="hero-grid"></div>
      <div class="hero-glow"></div>
      <div class="hero-brand"><img src="/assets/mark-96.png" alt="" width="40" height="40"><span class="chrome-text">Civia <b class="ai-text">AI</b></span></div>
      ${architectureScene()}
      <div class="hero-copy">
        <div class="eyebrow gold">Arquitectura inteligente</div>
        <h2 class="display">Del primer trazo a la obra, con un estudio que <span class="chrome-text">piensa contigo</span>.</h2>
        <ul class="hero-points">
          <li>${icon('blueprint')}<span>Planos revisados por IA</span></li>
          <li>${icon('cube')}<span>Modelado 3D sin límite de pisos</span></li>
          <li>${icon('shield')}<span>Tus proyectos, cifrados y sin conexión</span></li>
        </ul>
      </div>
      <div class="brand-mobile">
        <img src="/assets/mark-256.png" alt="" width="72" height="72">
        <div class="wordmark chrome-text">Civia <span class="ai-text">AI</span></div>
        <div class="eyebrow">Ingeniería y arquitectura inteligente</div>
      </div>
    </section>
    <section class="panel">${panel}</section>
  </div>`);

  // Los campos del formulario entran uno tras otro.
  const form = el.querySelector('.panel form, .panel .auth-card');
  if (form) stagger(form);

  // Aviso de Bloq Mayús mientras se escribe una contraseña.
  el.querySelectorAll('input[type=password]').forEach((input) => {
    const warn = $(`#${input.id}-caps`, el);
    const update = (e) => { if (warn && e.getModifierState) warn.hidden = !e.getModifierState('CapsLock'); };
    input.addEventListener('keydown', update);
    input.addEventListener('keyup', update);
    input.addEventListener('blur', () => { if (warn) warn.hidden = true; });
  });

  el.querySelectorAll('[data-toggle]').forEach((b) => {
    b.onclick = () => {
      const input = $(`#${b.dataset.toggle}`, el);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.innerHTML = icon(show ? 'eyeoff' : 'eye').s;
      b.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
      b.setAttribute('aria-pressed', String(show));
    };
  });
}

/**
 * Medidor de fuerza, requisitos marcados en vivo y revisión en el servidor (contraseñas comunes y
 * filtradas) mientras se escribe. Devuelve el control de validación del campo.
 */
function watchStrength(el, email = () => '') {
  const ctl = live($('#password', el), rules.newPassword(8, () => ({ email: email() })), {
    onResult: (r) => r.checks?.forEach((c) => $(`[data-check="${c.id}"]`, el)?.classList.toggle('ok', c.ok)),
  });
  const check = debounce(async (pw) => {
    if (!pw) return;
    try {
      const r = await api.post('/auth/password/check', { password: pw, email: email() });
      $('#pw-hint', el).textContent = r.valid ? 'Contraseña segura ✓' : r.problems.join(' ');
      $('#pw-hint', el).style.color = r.valid ? 'var(--ok)' : '';
    } catch { /* sin conexión */ }
  }, 350);
  $('#password', el).addEventListener('input', (e) => {
    $('#strength', el).className = `strength s${strength(e.target.value)}`;
    check(e.target.value);
  });
  return ctl;
}

export function render(el, params) {
  if (params.mode === 'forgot') return renderForgot(el);
  if (params.mode === 'reset') return renderReset(el, params.query);
  return renderLogin(el, params.mode === 'login');
}

/** "Confirma la contraseña": se revisa en vivo y también cuando cambia la primera. */
function confirmField(el) {
  const confirm = $('#confirm', el);
  const ctl = live(confirm, rules.same(() => $('#password', el).value, 'Las contraseñas no coinciden.'));
  $('#password', el).addEventListener('input', () => { if (confirm.value) ctl.refresh(); });
  return [confirm, ctl];
}

/** Correo con validación en vivo y sugerencia clicable si el dominio parece mal escrito. */
function wireEmail(el) {
  const input = $('#email', el);
  const ctl = live(input, rules.email, {
    onResult: (r) => {
      if (!r.suggestion) return;
      const msg = $('#email-msg', el);
      const fix = document.createElement('button');
      fix.type = 'button';
      fix.className = 'link-btn';
      fix.textContent = r.suggestion;
      fix.onclick = () => { input.value = r.suggestion; ctl.refresh(); input.focus(); };
      msg.replaceChildren('¿Quisiste decir ', fix, '?');
    },
  });
  return ctl;
}

/** Modo de la pantalla anterior: el selector se desliza desde ahí en vez de aparecer ya en su sitio. */
let lastMode = null;

function renderLogin(el, isLogin) {
  const from = lastMode ?? (isLogin ? 'login' : 'register');
  lastMode = isLogin ? 'login' : 'register';
  layout(el, html`
      <form id="auth-form" class="auth-card" novalidate>
        <nav class="seg" aria-label="Acceso">
          <a href="#/login" class="${isLogin ? 'active' : ''}" aria-current="${isLogin ? 'page' : 'false'}">Iniciar sesión</a>
          <a href="#/register" class="${isLogin ? '' : 'active'}" aria-current="${isLogin ? 'false' : 'page'}">Crear cuenta</a>
          <i class="seg-pill ${from === 'register' ? 'right' : ''}" aria-hidden="true"></i>
        </nav>
        <div class="eyebrow gold">${isLogin ? 'Bienvenido(a) de nuevo' : 'Crea tu estudio'}</div>
        <h1 style="margin:14px 0 8px">${isLogin ? html`Inicia <span class="chrome-text">sesión</span>` : html`Diseña con <span class="chrome-text">inteligencia</span>`}</h1>
        <p class="muted" style="margin-bottom:28px">${isLogin ? 'Accede a tus proyectos y a CIVIA Copilot.' : 'Tu cuenta queda protegida con Argon2id y sesiones cifradas.'}</p>
        <div class="stack lg">
          ${isLogin ? '' : html`
          ${textField('fullName', 'Nombre completo', { autocomplete: 'name', ic: 'user', placeholder: 'Ana María Pérez', required: true })}
          <div class="form-grid">
            ${textField('profession', 'Profesión', { autocomplete: 'organization-title', ic: 'ruler', placeholder: 'Ingeniera civil' })}
            ${textField('organization', 'Estudio / empresa', { autocomplete: 'organization', ic: 'building', placeholder: 'Opcional' })}
          </div>`}
          ${textField('email', 'Correo electrónico', { type: 'email', autocomplete: 'email', ic: 'mail', placeholder: 'tu@correo.com', required: true })}
          ${passwordField('password', 'Contraseña', isLogin ? 'current-password' : 'new-password',
            isLogin ? html`<a class="forgot" href="#/forgot">¿Olvidaste tu contraseña?</a>` : strengthHint())}
          ${isLogin ? '' : passwordField('confirm', 'Confirma la contraseña', 'new-password', '')}
          <div class="field" id="mfa-field" data-field="mfa" hidden>
            <label for="mfa">Código de verificación</label>
            <div class="input-wrap">${icon('key', 'lead')}
              <input class="input mono" id="mfa" name="mfa" inputmode="numeric" autocomplete="one-time-code" placeholder="123 456 o código de recuperación" aria-describedby="mfa-msg">
              <span class="state" aria-hidden="true"></span>
            </div>
            <div class="field-msg" id="mfa-msg" aria-live="polite"></div>
            <div class="hint">Abre tu app de autenticación. También puedes usar un código de recuperación.</div>
          </div>
          <div class="error-text" id="auth-error" role="alert"></div>
          <button class="btn primary lg block" type="submit" data-busy="${isLogin ? 'Entrando…' : 'Creando cuenta…'}">${isLogin ? 'Entrar' : 'Crear cuenta'} ${icon('arrow')}</button>
        </div>
        <div class="switch">${isLogin ? html`¿Aún no tienes cuenta? <a href="#/register">Regístrate</a>` : html`¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a>`}</div>
        ${footer}
      </form>`);

  const form = $('#auth-form', el);
  const errorBox = $('#auth-error', el);
  requestAnimationFrame(() => requestAnimationFrame(() => $('.seg-pill', el)?.classList.toggle('right', !isLogin)));

  // Validación en tiempo real de cada campo.
  const fields = [[$('#email', el), wireEmail(el)]];
  if (isLogin) {
    fields.push([$('#password', el), live($('#password', el), rules.loginPassword)]);
  } else {
    fields.unshift([$('#fullName', el), live($('#fullName', el), rules.fullName)]);
    fields.push([$('#password', el), watchStrength(el, () => $('#email', el).value)]);
    fields.push(confirmField(el));
  }
  const mfaInput = $('#mfa', el);
  const mfaCtl = live(mfaInput, rules.mfa);
  // Los 6 dígitos se agrupan solos como "123 456" (los códigos de recuperación quedan igual).
  mfaInput.addEventListener('input', () => {
    const digits = mfaInput.value.replace(/\s/g, '');
    if (/^\d{4,6}$/.test(digits)) mfaInput.value = `${digits.slice(0, 3)} ${digits.slice(3)}`;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    const toCheck = $('#mfa-field', el).hidden ? fields : [...fields, [mfaInput, mfaCtl]];
    if (!validateAll(toCheck)) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('[type=submit]');
    await busy(button, async () => {
      try {
        if (isLogin) {
          const r = await login(data.email, data.password, data.mfa);
          if (r.mfaRequired) {
            $('#mfa-field', el).hidden = false;
            $('#mfa', el).focus();
            errorBox.textContent = '';
            toast('Ingresa tu código de verificación en dos pasos.', 'info');
            return;
          }
          afterLogin();
        } else {
          await register({ fullName: data.fullName, email: data.email, password: data.password, profession: data.profession, organization: data.organization });
          toast('Cuenta creada. ¡Bienvenido(a) a CIVIA AI!');
          afterLogin();
        }
      } catch (err) {
        // Si el error es de un campo concreto, se muestra junto a ese campo.
        if (err.status === 409) {
          const f = $('[data-field="email"]', el);
          f.classList.add('invalid');
          $('#email-msg', el).replaceChildren(err.message, ' ', Object.assign(document.createElement('a'), { href: '#/login', textContent: 'Inicia sesión' }));
          $('#email', el).focus();
        } else {
          errorBox.textContent = err.message;
        }
      }
    });
  });
}

/** "¿Olvidaste tu contraseña?": pide el enlace. El servidor responde igual exista o no la cuenta. */
function renderForgot(el) {
  layout(el, html`
      <form id="forgot-form" class="auth-card" novalidate>
        <div class="eyebrow gold">Recupera tu cuenta</div>
        <h1 style="margin:14px 0 8px">¿Olvidaste tu <span class="chrome-text">contraseña</span>?</h1>
        <p class="muted" style="margin-bottom:28px">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva. El enlace vence en 30 minutos.</p>
        <div class="stack lg" id="forgot-body">
          ${textField('email', 'Correo electrónico', { type: 'email', autocomplete: 'email', ic: 'mail', placeholder: 'tu@correo.com', required: true })}
          <div class="error-text" id="auth-error" role="alert"></div>
          <button class="btn primary lg block" type="submit" data-busy="Enviando…">Enviar enlace ${icon('arrow')}</button>
        </div>
        <div class="switch">¿La recordaste? <a href="#/login">Inicia sesión</a></div>
        ${footer}
      </form>`);

  const form = $('#forgot-form', el);
  const errorBox = $('#auth-error', el);
  $('#email', el).focus();
  const emailCtl = wireEmail(el);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    if (!validateAll([[$('#email', el), emailCtl]])) return;
    const email = $('#email', el).value.trim();
    await busy(form.querySelector('[type=submit]'), async () => {
      try {
        const r = await api.post('/auth/password/forgot', { email });
        mount($('#forgot-body', el), html`
          <div class="notice-ok" role="status">${icon('check')}<span>${r.message}</span></div>
          <p class="hint">¿No llegó? Revisa la carpeta de correo no deseado o vuelve a intentarlo en unos minutos.</p>
          <a class="btn lg block" href="#/login">Volver a iniciar sesión</a>`);
      } catch (err) {
        errorBox.textContent = err.message;
      }
    });
  });
}

/** Token del enlace, solo en memoria: sobrevive a que la vista se vuelva a pintar sin él en la URL. */
let resetToken = '';

/** Nueva contraseña con el token del enlace del correo (#/reset?token=…). */
function renderReset(el, query) {
  const fromLink = query?.get('token');
  if (fromLink) {
    resetToken = fromLink;
    // El token sale de la barra de direcciones y del historial en cuanto se lee.
    history.replaceState(null, '', `${location.pathname}${location.search}#/reset`);
  }
  const token = resetToken;

  if (!token) {
    layout(el, html`
      <div class="auth-card">
        <div class="eyebrow gold">Recupera tu cuenta</div>
        <h1 style="margin:14px 0 8px">Enlace <span class="chrome-text">incompleto</span></h1>
        <p class="muted" style="margin-bottom:28px">Abre el enlace completo que te enviamos por correo o solicita uno nuevo.</p>
        <a class="btn primary lg block" href="#/forgot">Solicitar un enlace nuevo ${icon('arrow')}</a>
        <div class="switch"><a href="#/login">Volver a iniciar sesión</a></div>
      </div>`);
    return;
  }

  layout(el, html`
      <form id="reset-form" class="auth-card" novalidate>
        <div class="eyebrow gold">Recupera tu cuenta</div>
        <h1 style="margin:14px 0 8px">Crea una <span class="chrome-text">nueva contraseña</span></h1>
        <p class="muted" style="margin-bottom:28px">Al guardarla se cerrarán todas tus sesiones abiertas.</p>
        <div class="stack lg" id="reset-body">
          ${passwordField('password', 'Nueva contraseña', 'new-password', strengthHint())}
          ${passwordField('confirm', 'Repite la contraseña', 'new-password', '')}
          <div class="error-text" id="auth-error" role="alert"></div>
          <button class="btn primary lg block" type="submit" data-busy="Guardando…">Guardar contraseña ${icon('arrow')}</button>
        </div>
        <div class="switch"><a href="#/forgot">Solicitar otro enlace</a> · <a href="#/login">Iniciar sesión</a></div>
        ${footer}
      </form>`);

  const fields = [[$('#password', el), watchStrength(el)], confirmField(el)];
  const form = $('#reset-form', el);
  const errorBox = $('#auth-error', el);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    if (!validateAll(fields)) return;
    const password = $('#password', el).value;
    await busy(form.querySelector('[type=submit]'), async () => {
      try {
        const r = await api.post('/auth/password/reset', { token, password });
        resetToken = '';
        // El servidor cerró todas las sesiones; si había una abierta aquí, se olvida también.
        if (session.user) await logout();
        mount($('#reset-body', el), html`
          <div class="notice-ok" role="status">${icon('check')}<span>${r.message}</span></div>
          <a class="btn primary lg block" href="#/login">Iniciar sesión ${icon('arrow')}</a>`);
        toast('Contraseña actualizada.');
      } catch (err) {
        errorBox.textContent = err.message;
      }
    });
  });
}
