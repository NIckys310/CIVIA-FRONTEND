// Efectos de movimiento de CIVIA: discretos, rápidos y coherentes con el estilo de la marca
// (líneas de plano, brillo dorado). Todos respetan "reducir movimiento" del sistema.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

/** true si la persona pidió menos movimiento en su sistema. */
export const reducedMotion = () => reduce.matches;
