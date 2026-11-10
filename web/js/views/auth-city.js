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
  hero.append(host);
  const small = window.matchMedia('(max-width: 900px)').matches;
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
  const camera = new THREE.PerspectiveCamera(small ? 42 : 32, 1, 0.5, 5000);
  const target = new THREE.Vector3(0, 17, 2);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), mode === 'day' ? 0.12 : 0.4, 0.45, 0.93);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = () => {
    const w = host.clientWidth; const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
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
    // La cámara se balancea despacio frente a la manzana, sin perder la fachada principal.
    const a = still ? 0.25 : Math.sin(elapsed * 0.05) * 0.55 + 0.15;
    // La distancia se ajusta a la proporción del panel para que siempre quepa la manzana completa.
    const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(camera.aspect, 1.6);
    const radius = Math.min(220, Math.max(85, 38 / half));
    camera.position.set(Math.sin(a) * radius, 9 + radius * 0.07 + Math.sin(elapsed * 0.07) * 2, Math.cos(a) * radius);
    camera.lookAt(target);
    if (!still) { cars.update(dt); people.update(dt); }
    composer.render();
    if (!host.classList.contains('ready')) { host.classList.add('ready'); hero.classList.add('has-city'); }
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
