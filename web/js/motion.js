// Efectos de movimiento de CIVIA: discretos, rápidos y coherentes con el estilo de la marca
// (líneas de plano, brillo dorado). Todos respetan "reducir movimiento" del sistema.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

/** true si la persona pidió menos movimiento en su sistema. */
export const reducedMotion = () => reduce.matches;

const PRESSABLE = '.btn, .chip, .nav a, .mobile-nav a, .mobile-nav button, .nav-tile, .tabs a, .tabs button';

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

// ------------------------------------------------------------------ barra de progreso entre secciones
let routeBarEl = null;
let routeBarTimer = 0;

export function routeBarStart() {
  if (reducedMotion()) return;
  routeBarEl ||= Object.assign(document.body.appendChild(document.createElement('div')), { className: 'route-bar' });
  clearTimeout(routeBarTimer);
  routeBarEl.className = 'route-bar';
  void routeBarEl.offsetWidth;
  routeBarEl.className = 'route-bar run';
}

export function routeBarDone() {
  if (!routeBarEl) return;
  routeBarEl.className = 'route-bar end';
  routeBarTimer = setTimeout(() => { if (routeBarEl) routeBarEl.className = 'route-bar'; }, 460);
}

// ------------------------------------------------------------------ iconos que se trazan como líneas de plano
const DRAWN = '.cat-card .ico svg, .nav-tile-ico svg, .empty svg.big, .m-props-head svg';

/** Prepara los iconos para trazarse: cada línea mide 1 sin importar su longitud real. */
export function drawIcons(root) {
  if (reducedMotion() || !root?.querySelectorAll) return;
  root.querySelectorAll(DRAWN).forEach((svg) => {
    if (svg.classList.contains('draw')) return;
    svg.querySelectorAll('path, circle, rect, line, polyline').forEach((shape) => shape.setAttribute('pathLength', '1'));
    svg.classList.add('draw');
  });
}

/** Hace entrar los hijos de `container` uno tras otro (máximo 14 escalones). */
export function stagger(container) {
  if (reducedMotion() || !container || container.dataset.staggered) return;
  container.dataset.staggered = '1';
  [...container.children].forEach((child, i) => {
    // Lo que está fuera de pantalla entra cuando se llega a ello, no mientras nadie lo ve.
    if (child.getBoundingClientRect().top > window.innerHeight) { revealLater(child); return; }
    child.style.setProperty('--i', Math.min(i, 14));
    child.classList.add('enter');
    child.addEventListener('animationend', () => child.classList.remove('enter'), { once: true });
  });
}

const STAGGERED = '.grid, .kpi-grid, .cat-filter, .chips#suggested';
// Paneles de trabajo que siempre deben estar a la vista.
const NEVER_REVEAL = '.modeler, .camera, .chat, .modal, .calc-form, .calc-live, .skeleton, .view-skeleton, .reveal';

let revealObserver = null;
let revealBatch = 0;

/** Olvida las tarjetas de la sección anterior. */
export function resetReveals() {
  revealObserver?.disconnect();
  revealObserver = null;
}

function revealLater(el) {
  if (reducedMotion() || !('IntersectionObserver' in window)) return;
  revealObserver ||= new IntersectionObserver((entries) => {
    revealBatch = 0;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const item = e.target;
      revealObserver?.unobserve(item);
      item.style.transitionDelay = `${Math.min(revealBatch++, 4) * 50}ms`;
      item.classList.add('shown');
      // Al terminar se limpia para que la tarjeta recupere sus transiciones propias.
      setTimeout(() => { item.classList.remove('reveal', 'shown'); item.style.transitionDelay = ''; }, 800);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
  el.classList.add('reveal');
  revealObserver.observe(el);
}

function revealBelowFold(node) {
  if (reducedMotion()) return;
  const cards = [...(node.matches?.('.card') ? [node] : []), ...(node.querySelectorAll?.('.card') || [])];
  for (const c of cards) {
    if (c.closest(NEVER_REVEAL)) continue;
    if (c.getBoundingClientRect().top > window.innerHeight * 0.98) revealLater(c);
  }
}

/** Aplica la entrada escalonada a cada cuadrícula que aparece dentro de `root` (vistas que cargan datos después). */
export function autoStagger(root) {
  root.querySelectorAll(STAGGERED).forEach(stagger);
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches(STAGGERED)) stagger(n);
        n.querySelectorAll?.(STAGGERED).forEach(stagger);
        revealBelowFold(n);
        drawIcons(n);
        tilt(n, '.cat-card', 4);
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

/** Resalte que se desliza entre las opciones del menú lateral al pasar el cursor. */
export function navGlide(nav) {
  if (!nav || nav.querySelector('.nav-glide') || reducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const glide = document.createElement('span');
  glide.className = 'nav-glide';
  glide.setAttribute('aria-hidden', 'true');
  nav.prepend(glide);
  let visible = false;
  nav.addEventListener('pointerover', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const box = link.getBoundingClientRect();
    // La primera vez aparece en su sitio; después se desliza entre opciones.
    if (!visible) { glide.style.transition = 'opacity 140ms ease'; requestAnimationFrame(() => requestAnimationFrame(() => { glide.style.transition = ''; })); }
    glide.style.height = `${box.height}px`;
    glide.style.transform = `translateY(${box.top - nav.getBoundingClientRect().top}px)`;
    glide.style.opacity = link.classList.contains('active') ? '0' : '1';
    visible = true;
  });
  nav.addEventListener('pointerleave', () => { glide.style.opacity = '0'; visible = false; });
}

/** Indicador que se desliza entre las opciones de la barra del teléfono. */
export function moveMobilePill(nav) {
  if (!nav) return;
  let pill = nav.querySelector('.mn-pill');
  const sync = () => {
    const active = nav.querySelector('.active');
    if (!active) { pill.style.opacity = '0'; return; }
    const r = active.getBoundingClientRect();
    const p = nav.getBoundingClientRect();
    pill.style.opacity = '1';
    pill.style.width = `${r.width}px`;
    const x = Math.round(r.left - p.left - nav.clientLeft);
    if (pill.dataset.x && pill.dataset.x !== String(x) && !reducedMotion()) {
      pill.classList.remove('moving');
      void pill.offsetWidth;
      pill.classList.add('moving');
    }
    pill.dataset.x = String(x);
    pill.style.transform = `translateX(${x}px)`;
  };
  if (!pill) {
    pill = document.createElement('span');
    pill.className = 'mn-pill';
    pill.setAttribute('aria-hidden', 'true');
    nav.prepend(pill);
    pill.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => { pill.style.transition = ''; }));
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(nav);
  }
  sync();
}

/** Permite cerrar una hoja arrastrándola hacia abajo; un gesto rápido basta aunque sea corto. */
export function dragToDismiss(sheet, handle, close) {
  let startY = null; let startAt = 0; let moved = 0;
  handle.addEventListener('pointerdown', (e) => {
    if (startY !== null) return; // un segundo dedo no debe hacer saltar la hoja
    startY = e.clientY; startAt = performance.now(); moved = 0;
    handle.setPointerCapture(e.pointerId);
    sheet.style.transition = 'none';
  });
  handle.addEventListener('pointermove', (e) => {
    if (startY === null) return;
    moved = e.clientY - startY;
    // Hacia arriba opone resistencia en lugar de frenar en seco.
    sheet.style.transform = `translateY(${moved > 0 ? moved : -Math.sqrt(-moved)}px)`;
  });
  const release = () => {
    if (startY === null) return;
    const velocity = moved / (performance.now() - startAt);
    startY = null;
    sheet.style.transition = '';
    sheet.style.transform = '';
    if (moved > 90 || velocity > 0.5) close();
  };
  handle.addEventListener('pointerup', release);
  handle.addEventListener('pointercancel', release);
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
    if (card.classList.contains('tilt')) return;
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

/**
 * Indicador que se desliza entre las pestañas de un `.tabs` (la activa lleva la clase `active`).
 * Se reubica al cambiar la pestaña activa, el tamaño o las fuentes.
 */
export function slideTabs(tabs) {
  if (!tabs || tabs.dataset.ink) return;
  tabs.dataset.ink = '1';
  tabs.classList.add('has-ink');
  const ink = document.createElement('span');
  ink.className = 'tab-ink';
  ink.setAttribute('aria-hidden', 'true');
  tabs.prepend(ink);
  let first = true;
  const place = () => {
    const a = tabs.querySelector('.active');
    if (!a) { ink.style.opacity = '0'; return; }
    const r = a.getBoundingClientRect();
    const p = tabs.getBoundingClientRect();
    if (first) { ink.style.transition = 'none'; requestAnimationFrame(() => requestAnimationFrame(() => { ink.style.transition = ''; })); first = false; }
    ink.style.opacity = '1';
    ink.style.width = `${r.width}px`;
    ink.style.height = `${r.height}px`;
    ink.style.transform = `translate(${r.left - p.left + tabs.scrollLeft}px, ${r.top - p.top}px)`;
    // En barras que se desplazan, la pestaña activa queda centrada y nunca cortada.
    if (tabs.scrollWidth > tabs.clientWidth) tabs.scrollLeft += r.left + r.width / 2 - (p.left + p.width / 2);
  };
  new MutationObserver(place).observe(tabs, { subtree: true, attributes: true, attributeFilter: ['class'] });
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(tabs);
  document.fonts?.ready.then(place);
  place();
}

/** La última palabra del título va en dorado, igual que en los títulos que ya la traen destacada. */
function accentLastWord(h1) {
  if (h1.dataset.kinetic || h1.children.length) return;
  const text = h1.textContent.trim();
  const cut = text.lastIndexOf(' ');
  if (cut < 0) return;
  const accent = document.createElement('span');
  accent.className = 'chrome-text';
  accent.textContent = text.slice(cut + 1);
  h1.textContent = text.slice(0, cut + 1);
  h1.append(accent);
}

/** La línea de cota bajo el título mide exactamente lo que mide el texto. */
function measureTitles(root) {
  const measure = () => root.querySelectorAll('.page-head:not(.profile-head)').forEach((head) => {
    const h1 = head.querySelector('h1');
    if (!h1) return;
    const range = document.createRange();
    range.selectNodeContents(h1);
    head.style.setProperty('--title-w', `${Math.ceil(range.getBoundingClientRect().width)}px`);
  });
  measure();
  document.fonts?.ready.then(measure);
}

/** Mejoras comunes de cada sección: título con letras animadas, pestañas con indicador, cifras que cuentan. */
export function enhanceView(root) {
  if (!root) return;
  root.querySelectorAll('.page-head h1:not(#v-title)').forEach(accentLastWord);
  root.querySelectorAll('.content h1:not(.sr-only), .page-head .eyebrow').forEach((n) => { if (!n.querySelector('*:not(span)')) kinetic(n); });
  measureTitles(root);
  root.querySelectorAll('.page-head').forEach((h) => h.classList.add('ph2'));
  root.querySelectorAll('.tabs').forEach(slideTabs);
  root.querySelectorAll('.usage-val').forEach((v) => countUp(v, 1100));
  revealBelowFold(root);
  drawIcons(root);
  tilt(root, '.cat-card', 4);
}

/** Los iconos del menú se trazan al activarse: deben quedar medidos antes de marcar el activo. */
export function prepareNavIcons() {
  document.querySelectorAll('.nav svg, .mobile-nav svg').forEach((svg) => {
    svg.querySelectorAll('path, circle, rect').forEach((shape) => shape.setAttribute('pathLength', '1'));
  });
}

/** Imágenes de archivos y fotos: aparecen enfocándose en lugar de saltar a la vista. */
export function enableImageFade() {
  const mark = (e) => { if (e.target?.matches?.('.preview img')) e.target.classList.add('loaded'); };
  document.addEventListener('load', mark, true);
  document.addEventListener('error', mark, true);
}

/** Vibración mínima al tocar las opciones del menú del teléfono. */
export function enableNavHaptics() {
  document.addEventListener('click', (e) => { if (e.target.closest?.('.mobile-nav a, .mobile-nav button, .nav-tile')) haptic(6); }, { passive: true });
}
