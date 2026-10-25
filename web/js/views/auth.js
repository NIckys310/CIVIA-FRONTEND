// Inicio de sesión, registro y recuperación de contraseña (CIVIA Auth).
import { afterLogin } from '../app.js';
import { api, login, logout, register, session } from '../api.js';
import { $, busy, debounce, html, icon, mount, raw, toast } from '../ui.js';
import { kinetic, stagger } from '../motion.js';
import { districtScene } from './auth-scene.js';
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

/** Estructura común de las pantallas de acceso: escena de arquitectura y panel con el formulario. */
function layout(el, panel) {
  mount(el, html`
  <div class="auth">
    <section class="hero" aria-hidden="true">
      <div class="hero-grid"></div>
      <div class="hero-glow"></div>
      <div class="hero-brand"><img src="/assets/mark-96.png" alt="" width="40" height="40"><span class="chrome-text">Civia <b class="ai-text">AI</b></span></div>
      ${raw(districtScene())}
      <div class="hero-copy">
        <div class="eyebrow gold">Arquitectura inteligente</div>
        <h2 class="display">Del primer trazo a la obra, con un estudio que <span class="fx-accent">piensa contigo</span>.</h2>
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

  // Títulos y etiquetas: las letras entran una a una y la palabra destacada brilla en dorado.
  el.querySelectorAll('.auth-card h1, .auth-card > .eyebrow, .hero-copy h2, .hero-copy .eyebrow').forEach(kinetic);

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
      <form id="auth-form" class="auth-card ${from !== lastMode ? (isLogin ? 'from-left' : 'from-right') : ''}" novalidate>
        <nav class="seg ${isLogin ? '' : 'on-right'}" aria-label="Acceso">
          <a href="#/login" class="${isLogin ? 'active' : ''}" aria-current="${isLogin ? 'page' : 'false'}"><span>Iniciar sesión</span></a>
          <a href="#/register" class="${isLogin ? '' : 'active'}" aria-current="${isLogin ? 'false' : 'page'}"><span>Crear cuenta</span></a>
          <i class="seg-pill ${from === 'register' ? 'right' : ''}" aria-hidden="true"><b></b></i>
        </nav>
        <div class="eyebrow gold">${isLogin ? 'Bienvenido(a) de nuevo' : 'Crea tu estudio'}</div>
        <h1 style="margin:14px 0 8px">${isLogin ? html`Inicia <span class="fx-accent">sesión</span>` : html`Diseña con <span class="fx-accent">inteligencia</span>`}</h1>
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
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const pill = $('.seg-pill', el);
    if (!pill) return;
    const moving = pill.classList.contains('right') === isLogin;
    pill.classList.toggle('right', !isLogin);
    if (moving) { pill.classList.remove('moving'); void pill.offsetWidth; pill.classList.add('moving'); }
  }));

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
        <h1 style="margin:14px 0 8px">¿Olvidaste tu <span class="fx-accent">contraseña</span>?</h1>
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
        <h1 style="margin:14px 0 8px">Enlace <span class="fx-accent">incompleto</span></h1>
        <p class="muted" style="margin-bottom:28px">Abre el enlace completo que te enviamos por correo o solicita uno nuevo.</p>
        <a class="btn primary lg block" href="#/forgot">Solicitar un enlace nuevo ${icon('arrow')}</a>
        <div class="switch"><a href="#/login">Volver a iniciar sesión</a></div>
      </div>`);
    return;
  }

  layout(el, html`
      <form id="reset-form" class="auth-card" novalidate>
        <div class="eyebrow gold">Recupera tu cuenta</div>
        <h1 style="margin:14px 0 8px">Crea una <span class="fx-accent">nueva contraseña</span></h1>
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
