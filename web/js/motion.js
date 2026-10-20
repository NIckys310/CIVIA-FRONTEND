// Efectos de movimiento de CIVIA: discretos, rápidos y coherentes con el estilo de la marca
// (líneas de plano, brillo dorado). Todos respetan "reducir movimiento" del sistema.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

/** true si la persona pidió menos movimiento en su sistema. */
export const reducedMotion = () => reduce.matches;

const PRESSABLE = '.btn, .chip, .nav a, .mobile-nav a, .tabs a, .tabs button';

/** Onda dorada en el punto donde se pulsa un botón, chip o enlace de navegación. */
export function enableRipples(root = document) {
  root.addEventListener('pointerdown', (e) => {
    if (reducedMotion() || e.button !== 0) return;
    const target = e.target.closest(PRESSABLE);
    if (!target || target.disabled) return;
    const r = target.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    target.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }, { passive: true });
}
