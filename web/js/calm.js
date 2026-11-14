// Modo calma: al entrar en una sección, los efectos decorativos en bucle (auroras, grúa y autos del
// banner, destellos, anillos, partículas del fondo…) se animan como siempre durante unos segundos y
// después se detienen donde estén. Al cambiar de sección vuelven a animarse.
//
// Por qué: en gráficas integradas, decenas de animaciones infinitas repintando a la vez (más el fondo
// de partículas) bajaban la app a ~40 FPS; quietas, va por encima de 100. Así se conserva el efecto
// de entrada y la interfaz queda fluida mientras se trabaja.
//
// Nunca se detiene lo que informa de un estado: indicadores de carga, esqueletos, barras de progreso,
// cursores de escritura del Copilot ni la intro o la pantalla de carga.

const ACTIVE_MS = 8000;
const KEEP = '.spinner, .skeleton, [aria-busy="true"], .route-bar, .progress, .sp-bar, .intro, #splash, .typing, .caret, .stream-caret, [data-live]';

let timer = 0;
const marked = new Set();

const isDecor = (a) => {
  // También las que el propio componente tiene en pausa (fuera de pantalla): si no, volverían a correr.
  if (a.playState !== 'running' && a.playState !== 'paused') return false;
  const timing = a.effect?.getComputedTiming?.();
  if (!timing || timing.iterations !== Infinity) return false;
  const el = a.effect.target;
  return !(el?.closest?.(KEEP));
};

// Se marca el elemento (data-calm) y una regla CSS con !important pausa sus animaciones. No se usa
// Animation.pause(): algunos componentes (el banner del inicio) cambian su animation-play-state al
// entrar o salir de pantalla y volvían a ponerlas en marcha.
function sleep() {
  document.documentElement.classList.add('calm');
  for (const a of document.getAnimations()) {
    if (!isDecor(a)) continue;
    const el = a.effect.target;
    el.setAttribute('data-calm', '');
    marked.add(el);
  }
}

/** Reanuda los efectos y programa la calma (se llama al mostrar cada sección). */
export function wake() {
  clearTimeout(timer);
  document.documentElement.classList.remove('calm');
  for (const el of marked) el.removeAttribute('data-calm');
  marked.clear();
  timer = setTimeout(sleep, ACTIVE_MS);
}

/** ¿Están los efectos en calma? (el fondo de partículas deja de dibujarse). */
export const isCalm = () => document.documentElement.classList.contains('calm');
