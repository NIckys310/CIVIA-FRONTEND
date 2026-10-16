// Inicio de sesión y registro (CIVIA Auth).
import { afterLogin } from '../app.js';
import { api, login, register } from '../api.js';
import { $, busy, debounce, html, icon, mount, toast } from '../ui.js';

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

export function render(el, { mode }) {
  const isLogin = mode === 'login';
  mount(el, html`
  <div class="auth">
    <section class="hero" aria-hidden="true">
      <img src="/assets/logo-original.png" alt="" fetchpriority="high">
      <div class="caption">
        <p>Proyectos, planos, modelos 3D, cámara de obra y un copiloto de IA experto en arquitectura, en un solo lugar.</p>
      </div>
    </section>
    <section class="panel">
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
          ${passwordField('password', 'Contraseña', isLogin ? 'current-password' : 'new-password', isLogin ? '' : html`
            <div class="strength" id="strength"><i></i><i></i><i></i><i></i></div>
            <div class="hint" id="pw-hint">Mínimo 8 caracteres, sin límite máximo: puedes usar una frase larga.</div>`)}
          <div class="field" id="mfa-field" hidden>
            <label for="mfa">Código de verificación</label>
            <input class="input mono" id="mfa" name="mfa" inputmode="numeric" autocomplete="one-time-code" placeholder="123 456 o código de recuperación">
            <div class="hint">Abre tu app de autenticación. También puedes usar un código de recuperación.</div>
          </div>
          <div class="error-text" id="auth-error" role="alert"></div>
          <button class="btn primary lg block" type="submit" data-busy="${isLogin ? 'Entrando…' : 'Creando cuenta…'}">${isLogin ? 'Entrar' : 'Crear cuenta'} ${icon('arrow')}</button>
        </div>
        <div class="switch">${isLogin ? html`¿Aún no tienes cuenta? <a href="#/register">Regístrate</a>` : html`¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a>`}</div>
        <div class="ruled eyebrow" style="margin-top:34px;font-size:9px">Protegido por CIVIA Auth</div>
      </form>
    </section>
  </div>`);

  el.querySelectorAll('[data-toggle]').forEach((b) => {
    b.onclick = () => {
      const input = $(`#${b.dataset.toggle}`, el);
      input.type = input.type === 'password' ? 'text' : 'password';
    };
  });

  const form = $('#auth-form', el);
  const errorBox = $('#auth-error', el);

  if (!isLogin) {
    const check = debounce(async (pw, email) => {
      if (!pw) return;
      try {
        const r = await api.post('/auth/password/check', { password: pw, email });
        $('#pw-hint', el).textContent = r.valid ? 'Contraseña segura ✓' : r.problems.join(' ');
        $('#pw-hint', el).style.color = r.valid ? 'var(--ok)' : '';
      } catch { /* sin conexión */ }
    }, 350);
    $('#password', el).addEventListener('input', (e) => {
      $('#strength', el).className = `strength s${strength(e.target.value)}`;
      check(e.target.value, $('#email', el).value);
    });
  }

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
