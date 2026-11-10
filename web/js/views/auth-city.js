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
  const M = kit.kitMaterials(THREE);
  M.setGlow(sky.glow());
  scene.fog.near = 260;
  scene.fog.far = 1600;
  const r = kit.seeded(2026);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(110, 22), M.paver);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.02, 4);
  plaza.receiveShadow = true;
  scene.add(plaza);

  const tower = kit.slimTower(THREE, M, r, { floors: 11 });
  tower.position.set(0, 0, -2);
  const block = kit.apartmentBlock(THREE, M, r, { floors: 3 });
  block.position.set(-31, 0, -1);
  const house = kit.modernHouse(THREE, M, r);
  house.position.set(29, 0, 1);
  scene.add(tower, block, house);
  // Contexto: edificios al fondo para que la manzana se lea como ciudad.
  for (let i = 0; i < 14; i++) {
    const w = 12 + r() * 14; const h = 14 + r() * 46; const d = 12 + r() * 10;
    const b = kit.contextBuilding(THREE, M, r, w, h, d);
    b.position.set(-90 + i * 13 + r() * 6, 0, -34 - r() * 40);
    scene.add(b);
  }
  for (let i = 0; i < 10; i++) {
    const t = kit.tree(THREE, M, r, 0.8 + r() * 0.5);
    t.position.set(-60 + i * 13 + r() * 5, 0, 12 + r() * 2);
    scene.add(t);
  }

  const road = kit.street(THREE, M, r, { length: 220, z: 24 });
  scene.add(road);
  const cars = kit.traffic(THREE, M, r, road.userData.lanes, 220, 6);
  scene.add(cars.group);
  const [walkA, walkB] = road.userData.walks;
  const people = kit.crowd(THREE, r, [
    [[-90, walkA], [90, walkA]], [[90, walkB], [-90, walkB]],
    [[-44, 12], [44, 12]], [[-6, 8], [-6, 14.5], [6, 14.5], [6, 8]],
    [[20, 9], [38, 9], [38, 13], [20, 13]],
  ], small ? 14 : 24);
  scene.add(people.group);

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
