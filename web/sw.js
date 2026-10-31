/* CIVIA AI — service worker.
   - Interfaz (HTML, JS, CSS): primero la red, así cada versión publicada se ve al instante; la
     copia guardada solo se usa sin conexión.
   - Librerías, imágenes y fuentes: desde la caché y se actualizan en segundo plano.
   - Nunca se toca la API (/api/): datos y archivos privados siempre van a la red. Los archivos
     disponibles sin conexión los guarda la aplicación aparte (civia-files-v1), no este worker.
   - Una versión nueva espera hasta que la persona pulsa «Actualizar» (no recarga sola). */
const VERSION = 'civia-1.8.0';
const SHELL = [
  '/', '/index.html', '/css/app.css?v=1.8.0', '/js/app.js?v=1.8.0', '/js/api.js', '/js/ui.js', '/js/motion.js', '/js/validate.js',
  '/js/offline.js', '/js/intro.js', '/js/background.js', '/assets/mark-96.png', '/assets/mark-256.png', '/assets/mark-centered.png', '/assets/favicon.png', '/manifest.webmanifest',
];
const FILES_CACHE = 'civia-files-v1';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await (await caches.open(VERSION)).addAll(SHELL);
    // Las versiones 1.2.x no tenían el botón «Actualizar»: se reemplazan solas una única vez.
    if ((await caches.keys()).some((k) => /^civia-1\.[0-2]\./.test(k))) self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FILES_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skip-waiting') self.skipWaiting();
  if (event.data?.type === 'version') event.ports[0]?.postMessage(VERSION);
});

const isShell = (url, req) => url.origin === location.origin
  && (req.mode === 'navigate' || /\.(?:js|css|html|webmanifest)$/.test(url.pathname) || url.pathname === '/')
  && !url.pathname.startsWith('/vendor/');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;

  if (isShell(url, req)) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error())),
    );
    return;
  }

  // Stale-while-revalidate para librerías, imágenes y fuentes.
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res.ok && (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) {
          cache.put(req, res.clone());
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
