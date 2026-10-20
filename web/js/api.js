// Cliente de la API de CIVIA (mismo origen). El access token vive solo en memoria;
// el refresh token es una cookie HttpOnly que JavaScript no puede leer.

const BASE = '/api/v1';
let accessToken = null;
let refreshing = null;
const listeners = new Set();

export const session = {
  user: null,
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

const HINT = 'civia-signed-in';

function setSession(token, user) {
  accessToken = token;
  session.user = user;
  // Pista (no secreta) para no esperar una petición de refresco si nunca hubo sesión en este navegador.
  try { if (user) localStorage.setItem(HINT, '1'); else localStorage.removeItem(HINT); } catch { /* modo privado */ }
  listeners.forEach((fn) => fn(user));
}

export function hasSessionHint() {
  try { return localStorage.getItem(HINT) === '1'; } catch { return true; }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function parse(res) {
  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    const msg = (data && data.message) || (res.status === 413 ? 'El archivo es demasiado grande.' : `Error ${res.status}`);
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

/** Renueva el access token con la cookie de refresco (una sola petición aunque la pidan varios). */
export function refresh() {
  refreshing ||= fetch(`${BASE}/auth/token`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'refresh_token' }),
  }).then(parse).then((r) => { setSession(r.access_token, r.user); return true; })
    .catch(() => { setSession(null, null); return false; })
    .finally(() => { refreshing = null; });
  return refreshing;
}

export async function request(method, path, { body, signal, blob = false } = {}) {
  const run = () => fetch(BASE + path, {
    method,
    signal,
    credentials: 'same-origin',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
  let res = await run();
  if (res.status === 401 && !path.startsWith('/auth/token') && (await refresh())) {
    res = await run();
  }
  if (res.status === 401 && !path.startsWith('/auth/')) {
    setSession(null, null);
  }
  if (blob) {
    if (!res.ok) await parse(res);
    return res.blob();
  }
  return parse(res);
}

export const api = {
  get: (p, o) => request('GET', p, o),
  post: (p, body, o) => request('POST', p, { ...o, body: body ?? {} }),
  put: (p, body) => request('PUT', p, { body: body ?? {} }),
  patch: (p, body) => request('PATCH', p, { body: body ?? {} }),
  del: (p) => request('DELETE', p),
};

// ------------------------------------------------------------------ streaming (Server-Sent Events)

/**
 * POST que responde `text/event-stream`. Llama a `onEvent(nombre, datos)` por cada evento.
 * Se usa fetch (no EventSource) porque hace falta POST y la cabecera Authorization.
 */
export async function stream(path, body, { onEvent, signal } = {}) {
  const run = () => fetch(BASE + path, {
    method: 'POST',
    signal,
    credentials: 'same-origin',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  let res = await run();
  if (res.status === 401 && (await refresh())) res = await run();
  if (!res.ok || !res.body) return parse(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const dispatch = (chunk) => {
    let name = 'message';
    const data = [];
    for (const line of chunk.split('\n')) {
      if (line.startsWith('event:')) name = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (!data.length) return;
    let value = data.join('\n');
    try { value = JSON.parse(value); } catch { /* texto plano */ }
    onEvent?.(name, value);
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    let cut;
    while ((cut = buffer.indexOf('\n\n')) >= 0) {
      dispatch(buffer.slice(0, cut));
      buffer = buffer.slice(cut + 2);
    }
  }
  if (buffer.trim()) dispatch(buffer);
  return true;
}

// ------------------------------------------------------------------ CIVIA Auth

export async function login(email, password, mfaCode) {
  const r = await request('POST', '/auth/token', { body: { grant_type: 'password', email, password, mfa_code: mfaCode || null } });
  if (r.mfa_required) return { mfaRequired: true };
  setSession(r.access_token, r.user);
  return { user: r.user };
}

export async function register(data) {
  const r = await request('POST', '/auth/register', { body: data });
  setSession(r.access_token, r.user);
  return r.user;
}

export async function logout() {
  try { await request('POST', '/auth/revoke', { body: {} }); } catch { /* sin conexión: igual se limpia */ }
  blobCache.forEach((url) => URL.revokeObjectURL(url));
  blobCache.clear();
  setSession(null, null);
}

export function setUser(user) {
  setSession(accessToken, user);
}

export function adoptTokens(r) {
  setSession(r.access_token, r.user);
}

// ------------------------------------------------------------------ archivos

/** Sube un archivo con progreso. `fields` son parámetros adicionales del formulario. */
export function upload(path, file, fields = {}, onProgress) {
  const send = () => new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file, file.name);
    Object.entries(fields).forEach(([k, v]) => { if (v != null && v !== '') form.append(k, v); });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', BASE + path);
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* respuesta vacía */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError((data && data.message) || `Error ${xhr.status}`, xhr.status, data));
    };
    xhr.onerror = () => reject(new ApiError('Sin conexión con el servidor.', 0));
    xhr.send(form);
  });
  return send().catch(async (e) => {
    if (e.status === 401 && (await refresh())) return send();
    throw e;
  });
}

const blobCache = new Map();

/** URL local (blob:) de un archivo privado, descargado con autorización. */
export async function fileUrl(docId) {
  if (blobCache.has(docId)) return blobCache.get(docId);
  const blob = await request('GET', `/documents/${docId}/file`, { blob: true });
  const url = URL.createObjectURL(blob);
  blobCache.set(docId, url);
  return url;
}

export async function downloadFile(docId, name) {
  const blob = await request('GET', `/documents/${docId}/file?download=true`, { blob: true });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name || 'archivo';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export async function downloadPath(path, name) {
  const blob = await request('GET', path, { blob: true });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
