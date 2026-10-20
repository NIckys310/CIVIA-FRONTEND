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

/** Hace entrar los hijos de `container` uno tras otro (máximo 14 escalones). */
export function stagger(container) {
  if (reducedMotion() || !container || container.dataset.staggered) return;
  container.dataset.staggered = '1';
  [...container.children].forEach((child, i) => {
    child.style.setProperty('--i', Math.min(i, 14));
    child.classList.add('enter');
    child.addEventListener('animationend', () => child.classList.remove('enter'), { once: true });
  });
}

const STAGGERED = '.grid, .kpi-grid, .cat-filter, .chips#suggested';

/** Aplica la entrada escalonada a cada cuadrícula que aparece dentro de `root` (vistas que cargan datos después). */
export function autoStagger(root) {
  root.querySelectorAll(STAGGERED).forEach(stagger);
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches(STAGGERED)) stagger(n);
        n.querySelectorAll?.(STAGGERED).forEach(stagger);
      });
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/** Desvanece la vista actual antes de cambiar de sección. */
export function leave(view) {
  if (reducedMotion() || !view || !view.childElementCount) return Promise.resolve();
  view.classList.add('leaving');
  return new Promise((done) => setTimeout(done, 140));
}

/** Mueve el indicador del menú hasta el enlace activo (se crea la primera vez). */
export function moveNavPill(nav) {
  if (!nav) return;
  const active = nav.querySelector('a.active');
  let pill = nav.querySelector('.nav-pill');
  if (!pill) {
    pill = document.createElement('span');
    pill.className = 'nav-pill';
    pill.setAttribute('aria-hidden', 'true');
    nav.prepend(pill);
    nav.classList.add('has-pill');
    // La primera vez aparece en su sitio, sin deslizarse desde arriba.
    pill.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ''; }));
  }
  if (!active) { pill.style.opacity = '0'; return; }
  pill.style.opacity = '1';
  pill.style.height = `${active.offsetHeight}px`;
  pill.style.transform = `translateY(${active.offsetTop}px)`;
}
