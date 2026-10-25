// Perfil, preferencias y seguridad (contraseña, verificación en dos pasos, sesiones).
import { adoptTokens, api, setUser } from '../api.js';
import { applyTheme } from '../app.js';
import { $, avatar, busy, confirmDialog, fmtDate, fmtDateTime, formData, html, icon, modal, mount, toast } from '../ui.js';
import { countUp } from '../motion.js';
import { introEnabled, setIntroEnabled } from '../intro.js';
import { storagePanel } from './storage.js';

const EVENT_LABEL = {
  register: 'Cuenta creada', login: 'Inicio de sesión', locked: 'Bloqueo temporal', 'password-changed': 'Contraseña cambiada',
  'mfa-enabled': 'Verificación en dos pasos activada', 'mfa-disabled': 'Verificación en dos pasos desactivada',
  'session-closed': 'Sesión cerrada', 'sessions-closed': 'Todas las sesiones cerradas',
};

function device(ua = '') {
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Dispositivo';
  const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '';
  return `${br ? `${br} · ` : ''}${os}`;
}

export async function render(el) {
  const [u, sessions, events, policy] = await Promise.all([
    api.get('/auth/user'), api.get('/auth/sessions'), api.get('/auth/security-events'), api.get('/auth/password-policy'),
  ]);
  const p = u.profile || {};
  const pref = u.preferences || {};

  mount(el, html`
  <div class="page-head profile-head"><span class="ph-band" aria-hidden="true"></span><div class="row" style="gap:18px"><span class="avatar-ring">${avatar(u.fullName, u.avatarColor, 'lg')}<i aria-hidden="true"></i></span>
    <div><div class="eyebrow gold">${u.organization || 'CIVIA AI'}</div><h1 style="margin-top:8px">${u.fullName}</h1>
    <p class="muted" style="margin-top:4px">${u.email} · miembro desde ${fmtDate(u.createdAt)}</p></div></div></div>

  <div class="split">
    <div class="stack lg">
      <form class="card" id="profile-form">
        <div class="card-head"><h3>Perfil profesional</h3><button class="btn primary sm">Guardar</button></div>
        <div class="card-body form-grid">
          <div class="field"><label>Nombre completo</label><input class="input" name="fullName" value="${u.fullName}"></div>
          <div class="field"><label>Profesión</label><input class="input" name="profession" value="${u.profession || ''}"></div>
          <div class="field"><label>Teléfono <span class="hint">· cifrado</span></label><input class="input" name="phone" value="${u.phone || ''}" autocomplete="tel"></div>
          <div class="field"><label>Matrícula profesional <span class="hint">· cifrada</span></label><input class="input" name="professionalId" value="${p.professionalId || ''}"></div>
          <div class="field"><label>Empresa</label><input class="input" name="company" value="${p.company || ''}"></div>
          <div class="field"><label>Sitio web</label><input class="input" name="website" value="${p.website || ''}"></div>
          <div class="field"><label>Ciudad</label><input class="input" name="city" value="${p.city || ''}"></div>
          <div class="field"><label>País</label><input class="input" name="country" value="${p.country || ''}"></div>
          <div class="field full"><label>Biografía</label><textarea class="input" name="bio">${p.bio || ''}</textarea></div>
        </div>
      </form>

      <form class="card" id="password-form">
        <div class="card-head"><div><h3>Contraseña</h3><div class="hint" style="margin-top:4px">Protegida con ${policy.hash}. Mínimo ${policy.minLength} caracteres y sin límite máximo.</div></div></div>
        <div class="card-body form-grid">
          <div class="field full"><label>Contraseña actual</label><input class="input" type="password" name="currentPassword" autocomplete="current-password" required></div>
          <div class="field"><label>Nueva contraseña</label><input class="input" type="password" name="newPassword" autocomplete="new-password" required></div>
          <div class="field"><label>Confirmar</label><input class="input" type="password" name="confirm" autocomplete="new-password" required></div>
          <div class="full row"><span class="error-text" id="pw-error"></span><button class="btn primary right" data-busy="Guardando…">${icon('key')} Cambiar contraseña</button></div>
          <p class="hint full">Al cambiarla se cierran tus sesiones en otros dispositivos.</p>
        </div>
      </form>

      <div class="card">
        <div class="card-head"><h3>Historial de seguridad</h3></div>
        <div class="card-body table-wrap"><table class="table"><thead><tr><th>Evento</th><th>Detalle</th><th>IP</th><th>Fecha</th></tr></thead>
          <tbody>${events.map((e) => html`<tr><td>${EVENT_LABEL[e.type] || e.type}</td><td class="faint">${e.detail || ''}</td><td class="mono faint">${e.ipAddress || ''}</td><td class="faint">${fmtDateTime(e.createdAt)}</td></tr>`)}</tbody></table></div>
      </div>
    </div>

    <div class="stack lg">
      <div class="card glow pad mfa-card ${u.mfaEnabled ? 'on' : ''}">
        <span class="mfa-shield" aria-hidden="true">${icon('shield')}</span>
        <div class="row between"><div><div class="eyebrow gold">Verificación en dos pasos</div><h3 style="margin-top:8px">${u.mfaEnabled ? 'Activa' : 'Desactivada'}</h3></div>
          <span class="pill ${u.mfaEnabled ? 'ok' : 'warn'}"><span class="dot"></span>${u.mfaEnabled ? 'Protegida' : 'Recomendada'}</span></div>
        <p class="muted" style="font-size:13px;margin:10px 0 16px">Pide un código de tu app de autenticación (Google Authenticator, Authy, 1Password…) al iniciar sesión.</p>
        <button class="btn ${u.mfaEnabled ? 'danger' : 'primary'} block" id="mfa">${icon('shield')} ${u.mfaEnabled ? 'Desactivar' : 'Activar verificación en dos pasos'}</button>
      </div>

      <div class="card" id="copilot-usage" hidden>
        <div class="card-head"><h3>Tu uso del Copilot</h3><a class="btn sm ghost" href="#/copilot">${icon('sparkle')} Abrir</a></div>
        <div class="card-body grid g2 usage" id="usage-body"></div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Sesiones activas</h3><button class="btn sm ghost danger" id="close-all">Cerrar todas</button></div>
        <div class="card-body" id="sessions">${sessions.map((s, i) => html`<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div class="kpi" style="padding:0"><div class="ico" style="position:static;width:30px;height:30px">${icon('monitor')}</div></div>
          <div style="min-width:0"><div style="font-size:13.5px">${device(s.userAgent)} ${i === 0 ? html`<span class="pill gold">Reciente</span>` : ''}</div>
          <div class="hint">${s.ipAddress || ''} · desde ${fmtDate(s.createdAt)}</div></div>
          <button class="btn sm ghost icon right" data-close-session="${s.id}" title="Cerrar sesión">${icon('x')}</button></div>`)}</div>
      </div>

      <form class="card pad" id="prefs-form"><div class="eyebrow" style="margin-bottom:14px">Preferencias</div>
        <div class="stack">
          <div class="field"><label>Tema</label><select class="input" name="theme"><option value="dark" ${pref.theme !== 'light' ? 'selected' : ''}>Oscuro (recomendado)</option><option value="light" ${pref.theme === 'light' ? 'selected' : ''}>Claro</option></select></div>
          <div class="field"><label>Unidades</label><select class="input" name="units"><option value="metric">Métricas (m, m²)</option><option value="imperial" ${pref.units === 'imperial' ? 'selected' : ''}>Imperiales (ft, ft²)</option></select></div>
          <label class="check"><input type="checkbox" name="emailNotifications" ${pref.emailNotifications !== false ? 'checked' : ''}> Avisos por correo</label>
          <label class="check"><input type="checkbox" id="pref-intro" ${introEnabled() ? 'checked' : ''}> Intro de bienvenida al iniciar sesión</label>
          <button class="btn">Guardar preferencias</button>
        </div></form>
    </div>
  </div>
  <div id="storage-panel" style="margin-top:22px"></div>`);
  $('#pref-intro', el).onchange = (e) => { setIntroEnabled(e.target.checked); toast(e.target.checked ? 'La intro se mostrará al iniciar sesión.' : 'Intro desactivada.'); };
  storagePanel($('#storage-panel', el));

  $('#profile-form', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = formData(e.target);
    const updated = await api.patch('/auth/user', {
      fullName: d.fullName, profession: d.profession, phone: d.phone,
      profile: { professionalId: d.professionalId, company: d.company, website: d.website, city: d.city, country: d.country, bio: d.bio },
    });
    setUser(updated);
    toast('Perfil actualizado');
  });

  $('#prefs-form', el).addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = formData(e.target);
    const updated = await api.patch('/auth/user', { preferences: { theme: d.theme, units: d.units, emailNotifications: !!d.emailNotifications } });
    applyTheme(d.theme);
    setUser(updated);
    toast('Preferencias guardadas');
  });

  $('#password-form', el).addEventListener('submit', (e) => {
    e.preventDefault();
    const d = formData(e.target);
    const err = $('#pw-error', el);
    err.textContent = '';
    if (d.newPassword !== d.confirm) { err.textContent = 'Las contraseñas no coinciden.'; return; }
    busy(e.target.querySelector('button'), async () => {
      try {
        adoptTokens(await api.post('/auth/password', { currentPassword: d.currentPassword, newPassword: d.newPassword }));
        e.target.reset();
        toast('Contraseña cambiada. Se cerraron las demás sesiones.');
      } catch (x) {
        err.textContent = x.message;
      }
    });
  });

  $('#sessions', el).addEventListener('click', async (e) => {
    const b = e.target.closest('[data-close-session]');
    if (b) {
      await api.del(`/auth/sessions/${b.dataset.closeSession}`);
      toast('Sesión cerrada');
      render(el);
    }
  });
  $('#close-all', el).onclick = async () => {
    if (await confirmDialog('Cerrar todas las sesiones', 'Se cerrará la sesión en todos los dispositivos, incluido este.', 'Cerrar todas', true)) {
      await api.post('/auth/sessions/revoke-all');
      location.reload();
    }
  };

  $('#mfa', el).onclick = async () => {
    if (u.mfaEnabled) {
      const m = modal({ title: 'Desactivar verificación en dos pasos', body: html`<div class="field"><label>Confirma tu contraseña</label><input class="input" type="password" id="mfa-pw"></div>`,
        foot: html`<button class="btn danger" data-ok>Desactivar</button>` });
      m.el.querySelector('[data-ok]').onclick = async () => {
        try {
          await api.post('/auth/mfa/disable', { password: $('#mfa-pw', m.el).value });
          m.close();
          toast('Verificación en dos pasos desactivada');
          render(el);
        } catch (x) { toast(x.message, 'error'); }
      };
      return;
    }
    const setup = await api.post('/auth/mfa/setup');
    const m = modal({
      title: 'Activar verificación en dos pasos', eyebrow: 'Seguridad',
      body: html`<ol class="md" style="font-size:14px">
          <li>Abre tu app de autenticación y agrega una cuenta nueva.</li>
          <li>Escribe esta clave (o abre el enlace desde el teléfono):</li></ol>
        <div class="card pad mono" style="margin:12px 0;font-size:16px;letter-spacing:.12em;text-align:center;word-break:break-all">${setup.secret.match(/.{1,4}/g).join(' ')}</div>
        <a class="btn sm block" href="${setup.otpauthUri}">${icon('key')} Abrir en la app de autenticación</a>
        <div class="field" style="margin-top:18px"><label>Código de 6 dígitos</label><input class="input mono" id="mfa-code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456"></div>
        <div id="codes"></div>`,
      foot: html`<button class="btn primary" data-ok data-busy="Verificando…">Verificar y activar</button>`,
    });
    m.el.querySelector('[data-ok]').onclick = (e) => busy(e.currentTarget, async () => {
      try {
        const r = await api.post('/auth/mfa/enable', { code: $('#mfa-code', m.el).value });
        mount($('#codes', m.el), html`<div class="sep"></div><div class="eyebrow gold">Códigos de recuperación</div>
          <p class="muted" style="font-size:13px;margin:8px 0 12px">Guárdalos en un lugar seguro. Cada uno sirve una sola vez si pierdes el teléfono. No se volverán a mostrar.</p>
          <div class="grid g2 mono" style="gap:8px">${r.recoveryCodes.map((c) => html`<div class="pill" style="justify-content:center;height:30px">${c}</div>`)}</div>`);
        const ok = m.el.querySelector('[data-ok]');
        setTimeout(() => {
          ok.textContent = 'Listo, los guardé';
          ok.onclick = () => { m.close(); render(el); };
        });
        toast('Verificación en dos pasos activada');
      } catch (x) { toast(x.message, 'error'); }
    });
  };

  // Resumen del uso del Copilot (se carga aparte; si falla, la tarjeta queda oculta).
  api.get('/ai/usage').then((u2) => {
    const card = $('#copilot-usage', el);
    if (!card) return;
    const item = (label, value) => html`<div><div class="eyebrow">${label}</div><div class="usage-val">${value}</div></div>`;
    mount($('#usage-body', el), html`${item('Conversaciones', u2.conversations)}${item('Preguntas', u2.questions)}
      ${item('Respuestas útiles', u2.useful)}${item('Motor', u2.engine)}`);
    card.hidden = false;
    card.querySelectorAll('.usage-val').forEach((v) => countUp(v));
  }).catch(() => {});
}
