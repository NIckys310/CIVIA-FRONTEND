/** Registra el service worker de la PWA (solo en producción para no interferir con HMR). */
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* sin SW la app sigue funcionando en línea */
    });
  });
}
