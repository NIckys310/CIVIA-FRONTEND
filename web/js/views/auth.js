// Inicio de sesión, registro y recuperación de contraseña (CIVIA Auth).
import { afterLogin } from '../app.js';
import { api, login, logout, register, session } from '../api.js';
import { $, busy, debounce, html, icon, mount, toast } from '../ui.js';
import { stagger } from '../motion.js';

function strength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-záéíóúñ]/.test(pw) && /[A-ZÁÉÍÓÚÑ]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^\p{L}\d]/u.test(pw)) s++;
  return Math.min(4, Math.max(1, s));
}

const passwordField = (id, label, autocomplete, hint) => html`
  <div class="field">
    <label for="${id}">${label}</label>
    <div class="pw">
      <input class="input" id="${id}" name="${id}" type="password" autocomplete="${autocomplete}" required>
      <button type="button" class="btn ghost icon sm" data-toggle="${id}" aria-label="Mostrar contraseña">${icon('eye')}</button>
    </div>
    ${hint}
  </div>`;

const strengthHint = () => html`
  <div class="strength" id="strength"><i></i><i></i><i></i><i></i></div>
  <div class="hint" id="pw-hint">Mínimo 8 caracteres, sin límite máximo: puedes usar una frase larga.</div>`;

const footer = html`<div class="ruled eyebrow" style="margin-top:34px;font-size:9px">Protegido por CIVIA Auth</div>`;

/** Estructura común de las pantallas de acceso: imagen y panel con el formulario. */
function layout(el, panel) {
  mount(el, html`
  <div class="auth">
    <section class="hero" aria-hidden="true">
      <img src="/assets/logo-original.png" alt="" fetchpriority="high">
      <div class="brand-mobile">
        <img src="/assets/mark-256.png" alt="" width="84" height="84">
        <div class="wordmark chrome-text">Civia <span class="ai-text">AI</span></div>
        <div class="eyebrow">Ingeniería y arquitectura inteligente</div>
      </div>
    </section>
    <section class="panel">${panel}</section>
  </div>`);

  // Los campos del formulario entran uno tras otro.
  const form = el.querySelector('.panel form, .panel .auth-card');
  if (form) stagger(form);

  el.querySelectorAll('[data-toggle]').forEach((b) => {
    b.onclick = () => {
      const input = $(`#${b.dataset.toggle}`, el);
      input.type = input.type === 'password' ? 'text' : 'password';
    };
  });
}

/** Medidor de fuerza y validación en el servidor mientras se escribe. */
function watchStrength(el, email = () => '') {
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
}

export function render(el, params) {
  if (params.mode === 'forgot') return renderForgot(el);
  if (params.mode === 'reset') return renderReset(el, params.query);
  return renderLogin(el, params.mode === 'login');
}

function renderLogin(el, isLogin) {
  layout(el, html`
      <form id="auth-form" novalidate>
        <div class="eyebrow gold">${isLogin ? 'Bienvenido(a) de nuevo' : 'Crea tu estudio'}</div>
        <h1 style="margin:14px 0 8px">${isLogin ? html`Inicia <span class="chrome-text">sesión</span>` : html`Diseña con <span class="chrome-text">inteligencia</span>`}</h1>
        <p class="muted" style="margin-bottom:28px">${isLogin ? 'Accede a tus proyectos y a CIVIA Copilot.' : 'Tu cuenta queda protegida con Argon2id y sesiones cifradas.'}</p>
        <div class="stack lg">
          ${isLogin ? '' : html`
          <div class="field"><label for="fullName">Nombre completo</label><input class="input" id="fullName" name="fullName" autocomplete="name" required></div>
          <div class="form-grid">
            <div class="field"><label for="profession">Profesión</label><input class="input" id="profession" name="profession" placeholder="Arquitecta" autocomplete="organization-title"></div>
            <div class="field"><label for="organization">Estudio / empresa</label><input class="input" id="organization" name="organization" autocomplete="organization"></div>
          </div>`}
          <div class="field"><label for="email">Correo electrónico</label><input class="input" id="email" name="email" type="email" autocomplete="email" required></div>
          ${passwordField('password', 'Contraseña', isLogin ? 'current-password' : 'new-password',
            isLogin ? html`<a class="forgot" href="#/forgot">¿Olvidaste tu contraseña?</a>` : strengthHint())}
          <div class="field" id="mfa-field" hidden>
            <label for="mfa">Código de verificación</label>
            <input class="input mono" id="mfa" name="mfa" inputmode="numeric" autocomplete="one-time-code" placeholder="123 456 o código de recuperación">
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

  if (!isLogin) watchStrength(el, () => $('#email', el).value);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
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
        errorBox.textContent = err.message;
      }
    });
  });
}

/** "¿Olvidaste tu contraseña?": pide el enlace. El servidor responde igual exista o no la cuenta. */
function renderForgot(el) {
  layout(el, html`
      <form id="forgot-form" novalidate>
        <div class="eyebrow gold">Recupera tu cuenta</div>
        <h1 style="margin:14px 0 8px">¿Olvidaste tu <span class="chrome-text">contraseña</span>?</h1>
        <p class="muted" style="margin-bottom:28px">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva. El enlace vence en 30 minutos.</p>
        <div class="stack lg" id="forgot-body">
          <div class="field"><label for="email">Correo electrónico</label><input class="input" id="email" name="email" type="email" autocomplete="email" required></div>
          <div class="error-text" id="auth-error" role="alert"></div>
          <button class="btn primary lg block" type="submit" data-busy="Enviando…">Enviar enlace ${icon('arrow')}</button>
        </div>
        <div class="switch">¿La recordaste? <a href="#/login">Inicia sesión</a></div>
        ${footer}
      </form>`);

  const form = $('#forgot-form', el);
  const errorBox = $('#auth-error', el);
  $('#email', el).focus();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    const email = $('#email', el).value.trim();
    if (!email) { errorBox.textContent = 'Escribe tu correo electrónico.'; return; }
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
      <form id="reset-form" novalidate>
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

  watchStrength(el);
  const form = $('#reset-form', el);
  const errorBox = $('#auth-error', el);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    const password = $('#password', el).value;
    if (password !== $('#confirm', el).value) { errorBox.textContent = 'Las contraseñas no coinciden.'; return; }
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
