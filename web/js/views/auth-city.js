// Pantalla de acceso: una manzana urbana en 3D, iluminada según la hora, con una torre residencial,
// un edificio de apartamentos, una casa contemporánea, calle con tráfico y personas caminando.
// Si el navegador no tiene WebGL se conserva la ilustración vectorial.

const V = '/vendor/three';

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export async function mountCity(hero) {
  if (!hero || !webglAvailable()) return;
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
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const mode = env.currentTimeOfDay();
  const sky = env.createEnvironment(THREE, Sky, renderer, scene, { mode, shadowSize: 70 });
  const { cars, people } = (await import('../scene/city.js')).buildCity(THREE, kit, scene, sky, { small });
  // El cielo fotográfico se descarga aparte: se espera un momento para no mostrar primero el degradado.
  await Promise.race([sky.ready, new Promise((r) => { setTimeout(r, 4000); })]);
  if (!hero.isConnected) { sky.dispose(); renderer.dispose(); return; }
  const camera = new THREE.PerspectiveCamera(small ? 42 : 32, 1, 0.5, 5000);
  const target = new THREE.Vector3(0, 7, -2); // altura de los ojos de la cámara y plano de la fachada
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), mode === 'day' ? 0.12 : 0.4, 0.45, 0.93);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = () => {
    const w = host.clientWidth; const h = host.clientHeight;
    if (!w || !h) return;
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
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  let raf = 0; let elapsed = 0; let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(host);
  const frame = () => {
    if (!host.isConnected) { dispose(); return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    elapsed += dt;
    // Encuadre de fotografía de arquitectura: cámara a nivel (sin cabeceo), así las verticales de los
    // edificios salen paralelas, a la altura de un segundo piso y con un travelling lateral muy lento.
    // La distancia se ajusta a la proporción del panel: la torre ocupa algo más de la mitad del alto y su
    // base queda por encima del texto del panel.
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.min(300, Math.max(50 / tan, 34 / (tan * camera.aspect)));
    const drift = still ? 0 : Math.sin(elapsed * 0.035);
    const eyeY = target.y + (still ? 0 : Math.sin(elapsed * 0.05) * 0.5);
    camera.position.set(-7 + drift * 9, eyeY, target.z + dist);
    camera.lookAt(-7 + drift * 5, eyeY, target.z);
    if (!still) { cars.update(dt); people.update(dt); }
    composer.render();
    if (!host.classList.contains('ready')) { host.classList.add('ready'); hero.classList.add('has-city'); stage.classList.add('has-city'); }
  };
  function dispose() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    sky.dispose();
    scene.traverse((o) => { o.geometry?.dispose(); });
    renderer.dispose();
  }
  frame();
}
