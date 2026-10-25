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
  let pill = nav.querySelector('.nav-pill');
  if (!pill) {
    pill = document.createElement('span');
    pill.className = 'nav-pill';
    pill.setAttribute('aria-hidden', 'true');
    pill.innerHTML = '<i></i>';
    nav.prepend(pill);
    nav.classList.add('has-pill');
    // La primera vez aparece en su sitio, sin deslizarse desde arriba.
    pill.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ''; }));
    // Se vuelve a medir cuando cambian las fuentes o el tamaño (antes podía quedar desfasada).
    const sync = () => place(nav, pill, false);
    document.fonts?.ready.then(sync);
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(nav);
  }
  place(nav, pill, true);
}

function place(nav, pill, animate) {
  const active = nav.querySelector('a.active');
  if (!active) { pill.style.opacity = '0'; return; }
  // Posición medida en pantalla respecto al menú: no depende de offsetParent ni de transformaciones.
  const top = active.getBoundingClientRect().top - nav.getBoundingClientRect().top;
  const prev = Number(pill.dataset.top ?? top);
  pill.dataset.top = String(top);
  pill.style.opacity = '1';
  pill.style.height = `${active.getBoundingClientRect().height}px`;
  pill.style.transform = `translateY(${top}px)`;
  if (animate && Math.abs(prev - top) > 2 && !reducedMotion()) {
    pill.classList.remove('moving');
    void pill.offsetWidth;
    pill.classList.add('moving');
  }
}

/** Pasa la posición del cursor a la tarjeta para el brillo que lo sigue. */
export function enableSpotlight(root = document) {
  if (!window.matchMedia('(hover: hover)').matches) return;
  root.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.card.hover');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/** Cuenta desde 0 hasta el número que muestra el elemento (conserva el texto que lo rodea, p. ej. "m²"). */
export function countUp(el, duration = 900) {
  const text = el.textContent;
  const m = text.match(/\d[\d.,]*/);
  if (reducedMotion() || !m) return;
  const target = Number(m[0].replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(target) || target === 0) return;
  const [before, after] = [text.slice(0, m.index), text.slice(m.index + m[0].length)];
  const decimals = (m[0].split(',')[1] || '').length;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = `${before}${(target * eased).toLocaleString('es', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${after}`;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = text;
  };
  requestAnimationFrame(tick);
}

/** Aplica `change` (p. ej. cambiar el tema) revelándolo en círculo desde `origin`. */
export function circularReveal(origin, change) {
  if (reducedMotion() || !document.startViewTransition || !origin) { change(); return; }
  const r = origin.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = document.startViewTransition(change);
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
}

/** Marca la barra superior cuando la página se desplazó. */
export function elevateOnScroll(bar) {
  if (!bar) return;
  const update = () => bar.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/** Vibración corta en teléfonos (si el navegador lo permite y no se pidió menos movimiento). */
export function haptic(pattern = 12) {
  if (reducedMotion() || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch { /* algunos navegadores lo bloquean sin interacción */ }
}

/** Revela los elementos de `selector` dentro de `root` cuando entran en pantalla. Devuelve una función para limpiar. */
export function revealOnScroll(root, selector) {
  const items = [...root.querySelectorAll(selector)];
  if (reducedMotion() || !('IntersectionObserver' in window) || !items.length) return () => {};
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('shown');
      observer.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  items.forEach((el) => { el.classList.add('reveal'); observer.observe(el); });
  return () => observer.disconnect();
}

/**
 * Divide el texto de un título en letras para animarlas una a una (sube, se enfoca y brilla).
 * Los lectores de pantalla leen el texto completo del atributo aria-label, no las letras sueltas.
 */
export function kinetic(node) {
  if (!node || node.dataset.kinetic) return;
  node.dataset.kinetic = '1';
  node.setAttribute('aria-label', node.textContent.replace(/\s+/g, ' ').trim());
  node.classList.add('kinetic');
  let i = 0;
  const walk = (parent) => {
    [...parent.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        // Palabra por palabra (para que no se corten al final de la línea) y letra por letra dentro.
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const word = document.createElement('span');
          word.className = 'kw';
          [...part].forEach((ch) => {
            const c = document.createElement('span');
            c.className = 'kc';
            c.textContent = ch;
            c.style.setProperty('--ci', i++);
            word.append(c);
          });
          frag.append(word);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(node);
  node.querySelectorAll('.kc, .kw').forEach((s) => s.setAttribute('aria-hidden', 'true'));
}

/**
 * Inclinación 3D al pasar el cursor sobre las tarjetas de `selector` (solo con ratón), con un
 * reflejo que sigue al puntero. Usa las variables --rx, --ry, --gx y --gy.
 */
export function tilt(root, selector, max = 6) {
  if (reducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  root.querySelectorAll(selector).forEach((card) => {
    card.classList.add('tilt');
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      card.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      card.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/** El texto de ayuda de un campo se escribe y se borra solo, rotando entre varias frases. */
export function typewriterPlaceholder(input, phrases, { type = 45, hold = 2200 } = {}) {
  if (!input || !phrases.length) return () => {};
  if (reducedMotion()) { input.placeholder = phrases[0]; return () => {}; }
  let stopped = false;
  let i = 0;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  (async () => {
    while (!stopped && input.isConnected) {
      const text = phrases[i % phrases.length];
      for (let n = 1; n <= text.length && !stopped; n++) { if (!input.value) input.placeholder = text.slice(0, n) + '▍'; await sleep(type); }
      if (!input.value) input.placeholder = text;
      await sleep(hold);
      for (let n = text.length; n >= 0 && !stopped; n--) { if (!input.value) input.placeholder = text.slice(0, n) + '▍'; await sleep(type / 2); }
      i++;
    }
  })();
  return () => { stopped = true; };
}
