/*
 * Service worker de CIVIA (PWA).
 * - Recursos estáticos de Next (_next/static, iconos): cache-first (llevan hash en el nombre).
 * - Navegación: network-first con respaldo a la última versión de la página en caché.
 * - La API NUNCA se cachea aquí: los datos de proyectos son confidenciales y la
 *   sincronización offline se implementa explícitamente en la app móvil (Fase 4).
 */
const VERSION = 'civia-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // API y terceros: siempre red

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(PAGE_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => (await caches.match(request)) ?? caches.match('/')),
    );
  }
});
