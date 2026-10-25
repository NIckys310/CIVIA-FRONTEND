// Archivos disponibles sin conexión: los modelos 3D, planos y fotos que se abren se guardan en este
// dispositivo (Cache Storage) para abrir al instante y funcionar sin red. Cada archivo se guarda con
// su versión: si alguien sube una nueva, se descarga esa y la anterior se borra. Al cerrar sesión se
// borra todo, porque son archivos privados.

const CACHE = 'civia-files-v1';
const PREFIX = '/__civia/files/';
const PREF_ON = 'civia-offline';
const PREF_MAX = 'civia-offline-max';
export const DEFAULT_MAX = 2 * 1024 ** 3;

const supported = () => typeof caches !== 'undefined' && window.isSecureContext;
const get = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* modo privado */ } };

export const offlinePrefs = {
  get enabled() { return get(PREF_ON, 'on') !== 'off'; },
  set enabled(v) { set(PREF_ON, v ? 'on' : 'off'); },
  get maxBytes() { return Number(get(PREF_MAX, DEFAULT_MAX)) || 0; },
  set maxBytes(v) { set(PREF_MAX, String(v)); },
  supported,
};

const keyFor = (docId, version) => `${PREFIX}${docId}?v=${version ?? 0}`;

/** Archivo guardado de esa versión (o de cualquier versión, si `anyVersion`). */
async function lookup(docId, version, anyVersion = false) {
  if (!supported()) return null;
  const cache = await caches.open(CACHE);
  const exact = await cache.match(keyFor(docId, version));
  if (exact || !anyVersion) return exact;
  const keys = await cache.keys();
  const other = keys.find((r) => new URL(r.url).pathname === `${PREFIX}${docId}`);
  return other ? cache.match(other) : null;
}

async function store(docId, meta, blob) {
  if (!supported() || !offlinePrefs.enabled) return;
  const max = offlinePrefs.maxBytes;
  if (max && blob.size > max) return;
  const cache = await caches.open(CACHE);
  // Versiones anteriores del mismo archivo: fuera.
  for (const r of await cache.keys()) {
    if (new URL(r.url).pathname === `${PREFIX}${docId}`) await cache.delete(r);
  }
  const headers = new Headers({
    'Content-Type': blob.type || meta?.mediaType || 'application/octet-stream',
    'X-Civia-Name': encodeURIComponent(meta?.name || 'Archivo'),
    'X-Civia-Kind': meta?.kind || '',
    'X-Civia-Ext': meta?.extension || '',
    'X-Civia-Size': String(blob.size),
    'X-Civia-Saved': new Date().toISOString(),
    'X-Civia-Used': new Date().toISOString(),
  });
  await cache.put(keyFor(docId, meta?.version), new Response(blob, { headers }));
  await enforceLimit();
}

/** Borra los archivos usados hace más tiempo hasta quedar por debajo del espacio máximo. */
async function enforceLimit() {
  const max = offlinePrefs.maxBytes;
  if (!max) return;
  const items = await listFiles();
  let total = items.reduce((s, i) => s + i.size, 0);
  const cache = await caches.open(CACHE);
  for (const i of items.sort((a, b) => a.used.localeCompare(b.used))) {
    if (total <= max) break;
    await cache.delete(i.key);
    total -= i.size;
  }
}

/**
 * Devuelve el archivo: desde el dispositivo si ya está guardado en esta versión; si no, lo descarga
 * con `download()` y lo guarda. Sin conexión, sirve cualquier versión guardada.
 */
export async function offlineFile(docId, meta, download) {
  try {
    const hit = await lookup(docId, meta?.version);
    if (hit) return hit.blob();
  } catch { /* almacenamiento no disponible */ }
  try {
    const blob = await download();
    store(docId, meta, blob).catch(() => {});
    return blob;
  } catch (e) {
    const stale = await lookup(docId, meta?.version, true).catch(() => null);
    if (stale) return stale.blob();
    throw e;
  }
}

export async function listFiles() {
  if (!supported()) return [];
  const cache = await caches.open(CACHE);
  const out = [];
  for (const req of await cache.keys()) {
    const res = await cache.match(req);
    if (!res) continue;
    const h = res.headers;
    out.push({
      key: req.url,
      docId: new URL(req.url).pathname.slice(PREFIX.length),
      name: decodeURIComponent(h.get('X-Civia-Name') || 'Archivo'),
      kind: h.get('X-Civia-Kind') || '',
      extension: h.get('X-Civia-Ext') || '',
      size: Number(h.get('X-Civia-Size')) || 0,
      saved: h.get('X-Civia-Saved') || '',
      used: h.get('X-Civia-Used') || h.get('X-Civia-Saved') || '',
    });
  }
  return out.sort((a, b) => b.saved.localeCompare(a.saved));
}

export async function removeFile(key) {
  if (supported()) await (await caches.open(CACHE)).delete(key);
}

export async function clearFiles() {
  if (supported()) await caches.delete(CACHE);
}

/** Espacio usado y disponible en el dispositivo (estimación del navegador). */
export async function storageEstimate() {
  try { return await navigator.storage.estimate(); } catch { return null; }
}
