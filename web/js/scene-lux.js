// Escena de la ciudad a la hora dorada para el acceso (la misma que la pantalla de carga de index.html).
// Son capas SVG livianas (≈36 KB en total, generadas con tools/generate-scene.py) más cielo, sol y nubes
// en CSS: aparece al instante, sin WebGL ni tiempo de carga. Todo el movimiento es de capas completas
// (transform/opacity), que la GPU anima sin repintar:
// - Entrada: la ciudad se levanta por planos y las ventanas se encienden.
// - Paralaje con el puntero: cada plano se desplaza según su profundidad.
// - Nubes que derivan, resplandor del sol que respira y luces de autos por la avenida (el modo calma
//   de calm.js los detiene a los pocos segundos).

const LAYERS = ['far', 'mid', 'near', 'lights'];
// /assets se sirve con caché de 30 días: al regenerar las capas, subir esta versión (y la de index.html).
export const SCENE_V = '3';

/** Marcado de la escena (mismo que el de la pantalla de carga). */
export function sceneMarkup() {
  return `<div class="lx-scene" aria-hidden="true">
    <div class="lx-sky"><i class="lx-stars"></i><i class="lx-sun"></i><i class="lx-cloud c1"></i><i class="lx-cloud c2"></i><i class="lx-cloud c3"></i></div>
    ${LAYERS.map((l) => `<img class="lx-layer ${l}" src="/assets/scene/${l}.svg?v=${SCENE_V}" alt="" decoding="async" draggable="false">`).join('')}
    <i class="lx-car a"></i><i class="lx-car b"></i><i class="lx-car c"></i>
    <div class="lx-shade"></div>
  </div>`;
}

/** Paralaje con el puntero (solo con ratón y sin «reducir movimiento»). Devuelve la función que lo quita. */
export function parallax(scene) {
  if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  let tx = 0; let ty = 0; let x = 0; let y = 0; let raf = 0;
  const step = () => {
    x += (tx - x) * 0.07; y += (ty - y) * 0.07;
    scene.style.setProperty('--px', x.toFixed(4));
    scene.style.setProperty('--py', y.toFixed(4));
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.0005 ? requestAnimationFrame(step) : 0;
  };
  const move = (e) => {
    tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
    if (!raf) raf = requestAnimationFrame(step);
  };
  addEventListener('pointermove', move, { passive: true });
  return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); };
}
