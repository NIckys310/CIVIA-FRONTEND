/* CIVIA AI — service worker: la interfaz abre al instante desde caché y se actualiza en segundo plano.
   Nunca se cachea la API (/api/): datos y archivos privados siempre van a la red. */
const VERSION = 'civia-1.2.0';
const SHELL = [
  '/', '/index.html', '/css/app.css?v=1.2.0', '/js/app.js?v=1.2.0', '/js/api.js', '/js/ui.js', '/js/motion.js', '/js/validate.js',
  '/assets/mark-96.png', '/assets/mark-256.png', '/assets/favicon.png', '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;

  // Stale-while-revalidate para la interfaz, librerías y fuentes.
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(event.request);
      const network = fetch(event.request).then((res) => {
        if (res.ok && (url.origin === location.origin || url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com'))) {
          cache.put(event.request, res.clone());
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    }),
  );
});
