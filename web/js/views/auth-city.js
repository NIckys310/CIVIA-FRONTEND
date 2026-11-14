// Pantalla de acceso: una manzana urbana en 3D con una torre residencial, un edificio de apartamentos,
// una casa contemporánea, calle con tráfico y personas caminando. En tema oscuro es la hora dorada del
// atardecer (ventanas encendidas, sol bajo y cálido); en tema claro, de día. La cámara se mueve muy poco
// con el puntero (paralaje). Si el navegador no tiene WebGL se conserva el cielo de CSS.
//
// Rendimiento (es un fondo: debe ir fluido también en gráficas integradas):
// - Calidad adaptativa: empieza en el nivel más liviano (fluido desde el primer segundo) y sube solo si
//   la página entera sigue sin perder cuadros; si un nivel la hace perder cuadros, baja y no vuelve a él.
// - Sombras calculadas una sola vez: la ciudad no se mueve y el sol tampoco. Autos y personas no
//   proyectan sombra (si no, quedarían sombras fijas donde estaban al empezar).
// - Shaders compilados en segundo plano antes del primer cuadro (sin congelar la página).
// - Resplandor (bloom) a media resolución.
// - No se dibuja con la pestaña oculta ni cuando la portada no está en pantalla.

/** Atardecer del acceso según el tema: oscuro → hora dorada, claro → día. */
const modeForTheme = () => (document.documentElement.dataset.theme === 'light' ? 'day' : 'dusk');

const V = '/vendor/three';

/** Niveles de calidad, del mejor al más liviano. */
// La escena nunca se dibuja a más de 60 cuadros por segundo, aunque la pantalla sea de 120/144 Hz:
// es un fondo que se mueve despacio y la interfaz sigue a la frecuencia completa de la pantalla.
const TIERS = [
  { dpr: 1.25, samples: 4, bloom: true, fps: 60 },
  { dpr: 1, samples: 2, bloom: true, fps: 60 },
  { dpr: 0.9, samples: 0, bloom: true, fps: 30 },
  { dpr: 0.8, samples: 0, bloom: false, fps: 30 },
];

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}


/** Cede el hilo principal al navegador (la página sigue respondiendo entre pasos largos). */
const yieldToBrowser = () => new Promise((r) => { if (globalThis.scheduler?.yield) globalThis.scheduler.yield().then(r); else setTimeout(r, 0); });

/** Espera a que el navegador esté libre (el formulario ya se pinta y responde antes que la ciudad). */
const whenIdle = (timeout = 1200) => new Promise((r) => {
  if ('requestIdleCallback' in window) requestIdleCallback(() => r(), { timeout }); else setTimeout(r, 200);
});

export async function mountCity(hero) {
  if (!hero || !webglAvailable()) return;
  await whenIdle();
  if (!hero.isConnected) return;
  const [THREE, { Sky }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, env, kit] = await Promise.all([
    import(`${V}/three.module.min.js`), import(`${V}/addons/objects/Sky.js`),
    import(`${V}/addons/postprocessing/EffectComposer.js`), import(`${V}/addons/postprocessing/RenderPass.js`),
    import(`${V}/addons/postprocessing/UnrealBloomPass.js`), import(`${V}/addons/postprocessing/OutputPass.js`),
    import('../scene/environment.js'), import('../scene/kit.js'),
  ]);
  if (!hero.isConnected) return;

  const host = document.createElement('div');
  host.className = 'hero-city';
  const small = window.matchMedia('(max-width: 900px)').matches;
  // En escritorio la escena ocupa toda la pantalla (también detrás del formulario) y se funde con un
  // degradado: sin el corte donde terminaba el panel de la izquierda. En móvil vive en el encabezado.
  const stage = !small && hero.parentElement ? hero.parentElement : hero;
  if (stage === hero) hero.append(host); else stage.prepend(host);
  // Sin antialias en el lienzo: el suavizado lo hace (o no) el render target según el nivel.
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  let mode = modeForTheme();
  const sky = env.createEnvironment(THREE, Sky, renderer, scene, { mode, shadowSize: 70, shadowMap: small ? 1024 : 2048 });
  await yieldToBrowser();
  const { cars, people, setGlow } = await (await import('../scene/city.js')).buildCity(THREE, kit, scene, sky, { small });
  if (!hero.isConnected) { sky.dispose(); renderer.dispose(); return; }
  // Lo que se mueve no proyecta sombra: las sombras se calculan una sola vez para lo estático.
  for (const g of [cars.group, people.group]) g?.traverse((o) => { o.castShadow = false; });
  // Hora dorada: un poco más de exposición y ventanas más encendidas que el atardecer del modelador.
  const golden = () => { if (mode === 'dusk') { renderer.toneMappingExposure = 1.42; setGlow?.(2.1); } else setGlow?.(sky.glow()); };
  golden();
  // El cielo fotográfico se descarga aparte: se espera un momento para no mostrar primero el degradado.
  await Promise.race([sky.ready, new Promise((r) => { setTimeout(r, 4000); })]);
  if (!hero.isConnected) { sky.dispose(); renderer.dispose(); return; }
  const camera = new THREE.PerspectiveCamera(small ? 42 : 32, 1, 0.5, 5000);
  const target = new THREE.Vector3(0, 7, -2); // altura de los ojos de la cámara y plano de la fachada

  // ----- composición por nivel de calidad
  let tier = TIERS.length - 1;
  let ceiling = 0; // nivel más alto permitido (sube cuando un nivel resultó demasiado pesado)
  let composer = null; let bloom = null;
  const bloomStrength = () => (mode === 'day' ? 0.12 : 0.5);
  function buildComposer() {
    const t = TIERS[tier];
    composer?.dispose?.();
    renderer.setPixelRatio(Math.min(devicePixelRatio, t.dpr));
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: t.samples }));
    composer.addPass(new RenderPass(scene, camera));
    bloom = null;
    if (t.bloom) {
      bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), bloomStrength(), 0.5, 0.9);
      // El resplandor es difuso por naturaleza: a media resolución se ve igual y cuesta la cuarta parte.
      const setBloomSize = bloom.setSize.bind(bloom);
      bloom.setSize = (w, h) => setBloomSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
      composer.addPass(bloom);
    }
    composer.addPass(new OutputPass());
    resize();
  }

  // Cambio de tema desde la barra superior: la ciudad pasa de atardecer a día (y vuelve).
  const themeWatch = new MutationObserver(() => {
    const next = modeForTheme();
    if (next === mode) return;
    mode = next;
    sky.setTime(mode).then(() => {
      golden();
      if (bloom) bloom.strength = bloomStrength();
      renderer.shadowMap.needsUpdate = true; // el sol cambió de posición
    });
  });
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // Paralaje con el puntero: la cámara se desplaza unos centímetros, suavizado.
  const aim = { x: 0, y: 0 }; const look = { x: 0, y: 0 };
  const onPointer = (e) => { aim.x = (e.clientX / innerWidth) * 2 - 1; aim.y = (e.clientY / innerHeight) * 2 - 1; };
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) addEventListener('pointermove', onPointer, { passive: true });

  function resize() {
    const w = host.clientWidth; const h = host.clientHeight;
    if (!w || !h || !composer) return;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    // El encuadre se compone sobre el panel de la izquierda (ref) y la imagen se extiende hacia la
    // derecha, detrás del formulario, sin mover la composición.
    const ref = stage === hero ? w : Math.max(1, hero.clientWidth || w);
    camera.aspect = ref / h;
    // En paneles verticales (móvil) el encuadre se desplaza como un objetivo descentrable: el horizonte
    // baja, queda cielo detrás de la marca y no sobra suelo. Las verticales siguen rectas.
    const shift = small ? Math.min(0.24, Math.max(0.1, (1.3 - camera.aspect) * 0.3)) : 0;
    if (shift > 0 || ref !== w) camera.setViewOffset(ref, h, 0, -shift * h, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  buildComposer();

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const place = (dt) => {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.min(300, Math.max(50 / tan, 34 / (tan * camera.aspect)));
    const drift = still ? 0 : Math.sin(elapsed * 0.035);
    if (!still) { look.x += (aim.x - look.x) * Math.min(1, dt * 2.2); look.y += (aim.y - look.y) * Math.min(1, dt * 2.2); }
    const eyeY = target.y + (still ? 0 : Math.sin(elapsed * 0.05) * 0.5) - look.y * 1.2;
    camera.position.set(-7 + drift * 9 + look.x * 3.5, eyeY, target.z + dist);
    camera.lookAt(-7 + drift * 5 + look.x * 1.5, eyeY, target.z);
  };

  // Compilar los shaders antes del primer cuadro, sin bloquear la página (KHR_parallel_shader_compile).
  let elapsed = 0;
  let io = null;
  place(0);
  renderer.shadowMap.needsUpdate = true;
  try { await renderer.compileAsync(scene, camera); } catch { /* navegadores sin compilación paralela */ }
  if (!hero.isConnected) { dispose(); return; }

  // La portada (no el lienzo, que es fijo) dice si la escena está en pantalla.
  let visible = true;
  io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(stage === hero ? host : hero);

  // Calidad adaptativa sobre los cuadros de TODA la página (cada requestAnimationFrame), no solo los de
  // la escena: lo que se siente como lag es que la interfaz pierda cuadros.
  // - refresh: el intervalo más corto visto ≈ un refresco de la pantalla (60, 120, 144 Hz…).
  // - Si el 95 % de los cuadros cabe en 1,3 refrescos durante 3 ventanas seguidas, sube un nivel.
  // - Si el p95 pasa de 2 refrescos (y de 24 ms), baja un nivel y ese nivel queda vetado.
  const win = [];
  let refresh = 1000; let good = 0;
  const judge = (ms) => {
    if (ms > 0) refresh = Math.min(refresh, ms);
    win.push(ms);
    if (win.length < 90) return;
    win.sort((a, b) => a - b);
    const p95 = win[Math.floor(win.length * 0.95)];
    win.length = 0;
    if (p95 > Math.max(refresh * 2, 24) && tier < TIERS.length - 1) {
      ceiling = Math.max(ceiling, tier + 1);
      tier += 1; good = 0; buildComposer();
    } else if (p95 <= refresh * 1.3 && tier > ceiling) {
      good += 1;
      if (good >= 3) { tier -= 1; good = 0; buildComposer(); }
    } else good = 0;
  };

  let raf = 0; let warm = 0; let lastDraw = performance.now(); let lastTick = lastDraw;
  const frame = (now) => {
    if (!host.isConnected) { dispose(); return; }
    raf = requestAnimationFrame(frame);
    const tick = now - lastTick;
    lastTick = now;
    if (!visible || document.hidden) { warm = 0; lastDraw = now; win.length = 0; return; }
    // Se empieza a juzgar 1,5 s después de que la escena aparece: antes aún hay trabajo de carga.
    if (warm >= 1500) judge(tick);
    // Tope de cuadros del nivel (60 o 30), con margen para no saltarse el cuadro por redondeo.
    if (now - lastDraw < 1000 / TIERS[tier].fps - 4) return;
    const interval = now - lastDraw;
    const dt = Math.min(interval / 1000, 0.05);
    lastDraw = now;
    elapsed += dt;
    place(dt);
    if (!still) { cars.update(dt); people.update(dt); }
    composer.render();
    if (warm < 1500) warm += interval;
    if (!host.classList.contains('ready')) { host.classList.add('ready'); hero.classList.add('has-city'); stage.classList.add('has-city'); }
  };
  function dispose() {
    cancelAnimationFrame(raf);
    themeWatch.disconnect();
    removeEventListener('pointermove', onPointer);
    ro.disconnect();
    io?.disconnect();
    sky.dispose();
    composer?.dispose?.();
    scene.traverse((o) => { o.geometry?.dispose(); });
    renderer.dispose();
  }
  raf = requestAnimationFrame(frame);
}
