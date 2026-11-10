// Modo presentación del modelador: el modelo sobre un terreno completo con cielo según la hora,
// calle, andenes, árboles, edificios vecinos, personas que caminan, autos y un recorrido guiado.
import { html, icon, mount } from '../ui.js';

const V = '/vendor/three';

export async function startPresentation(ctx) {
  const { THREE, renderer, scene, camera, orbit, composer, stage, mats, bounds, hidden, onExit } = ctx;
  const [{ UnrealBloomPass }, env, kit] = await Promise.all([
    import(`${V}/addons/postprocessing/UnrealBloomPass.js`), import('../scene/environment.js'), import('../scene/kit.js'),
  ]);

  const b = bounds();
  const c = b.getCenter(new THREE.Vector3());
  const size = b.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.z, 12);
  const M = kit.kitMaterials(THREE);
  const r = kit.seeded(31);

  // Lo que solo sirve para editar se oculta y se recuerda para restaurarlo.
  const restore = hidden.map((o) => [o, o.visible]);
  hidden.forEach((o) => { o.visible = false; });
  const previous = { background: scene.background, environment: scene.environment, intensity: scene.environmentIntensity, exposure: renderer.toneMappingExposure, fog: scene.fog, maxDistance: orbit.maxDistance };
  scene.background = null;
  const sky = env.createEnvironment(THREE, null, renderer, scene, { mode: env.currentTimeOfDay(), shadowSize: radius + 40 });
  sky.sun.target.position.copy(c);
  scene.fog.near = radius * 6;
  scene.fog.far = radius * 30 + 600;
  orbit.maxDistance = radius * 12;

  // Terreno: lote pavimentado, zonas verdes, calle al frente y vecinos a los lados y al fondo.
  const site = new THREE.Group();
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), M.grass);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = -0.02;
  lawn.receiveShadow = true;
  site.add(lawn);
  const plot = new THREE.Mesh(new THREE.PlaneGeometry(size.x + 10, size.z + 10), M.paver);
  plot.rotation.x = -Math.PI / 2;
  plot.position.set(c.x, 0.005, c.z);
  plot.receiveShadow = true;
  site.add(plot);
  const streetZ = b.max.z + 14;
  const road = kit.street(THREE, M, r, { length: Math.max(260, radius * 10), z: streetZ });
  road.position.x = c.x;
  site.add(road);
  for (let i = 0; i < 12; i++) {
    const t = kit.tree(THREE, M, r, 0.8 + r() * 0.5);
    const side = i % 2 ? 1 : -1;
    t.position.set(c.x + side * (size.x / 2 + 10 + r() * 6), 0, b.min.z + (i / 12) * (size.z + 10));
    site.add(t);
  }
  for (let i = 0; i < 9; i++) {
    const w = 12 + r() * 12; const h = 9 + r() * Math.max(20, size.y * 1.3); const d = 12 + r() * 8;
    const n = kit.contextBuilding(THREE, M, r, w, h, d);
    const lane = i % 3;
    n.position.set(c.x + (lane - 1) * (radius + 26) + (r() - 0.5) * 8, 0, b.min.z - 24 - Math.floor(i / 3) * 26);
    site.add(n);
  }
  for (const side of [-1, 1]) {
    const n = kit.contextBuilding(THREE, M, r, 14, 10 + r() * 14, size.z + 4);
    n.position.set(c.x + side * (size.x / 2 + 22), 0, c.z);
    n.rotation.y = side * 0;
    site.add(n);
  }
  scene.add(site);

  const cars = kit.traffic(THREE, M, r, road.userData.lanes.map((z) => z), Math.max(260, radius * 10), 6);
  cars.group.position.x = c.x;
  site.add(cars.group);

  // Personas: andenes, perímetro del lote y entrada principal.
  const [walkA, walkB] = road.userData.walks;
  const L = Math.max(260, radius * 10) / 2;
  const ring = [[b.min.x - 3, b.min.z - 3], [b.max.x + 3, b.min.z - 3], [b.max.x + 3, b.max.z + 3], [b.min.x - 3, b.max.z + 3]];
  const routes = [
    [[c.x - L, walkA], [c.x + L, walkA]], [[c.x + L, walkB], [c.x - L, walkB]], ring,
    [[c.x - 2, walkA], [c.x - 2, b.max.z + 2], [c.x + 2, b.max.z + 2], [c.x + 2, walkA]],
  ];
  const people = kit.crowd(THREE, r, routes, 22);
  people.group.visible = true;
  site.add(people.group);

  // Ventanas del modelo encendidas al atardecer y de noche.
  const glass = mats.get('vidrio');
  const glassBefore = { emissive: glass.emissive?.getHex(), intensity: glass.emissiveIntensity };
  const applyTime = (mode) => {
    sky.setTime(mode);
    M.setGlow(sky.glow());
    if (glass.emissive) {
      glass.emissive.setHex(0xffc27a);
      glass.emissiveIntensity = mode === 'day' ? 0 : sky.glow() * 0.35;
    }
    bloom.strength = mode === 'day' ? 0.1 : 0.45;
    stage.querySelectorAll('[data-time]').forEach((x) => x.classList.toggle('active', x.dataset.time === mode));
  };
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.45, 0.92);
  composer.insertPass(bloom, composer.passes.length - 1);

  // Recorrido: a pie desde el andén, alrededor del edificio y luego en vuelo.
  const eye = 1.65;
  const tourPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(c.x - radius * 0.9, eye, walkA),
    new THREE.Vector3(c.x, eye, walkA),
    new THREE.Vector3(c.x, eye, b.max.z + 4),
    new THREE.Vector3(b.max.x + 5, eye, b.max.z + 4),
    new THREE.Vector3(b.max.x + 5, eye, b.min.z - 5),
    new THREE.Vector3(b.min.x - 5, eye + 2, b.min.z - 5),
    new THREE.Vector3(b.min.x - radius * 0.8, size.y * 0.8 + 8, c.z + radius),
    new THREE.Vector3(c.x + radius * 1.3, size.y * 1.4 + 14, c.z + radius * 1.6),
  ]);
  let tour = null;
  const startTour = () => {
    tour = { t: 0, duration: 38 };
    orbit.enabled = false;
    stage.classList.add('touring');
  };
  const stopTour = () => {
    tour = null;
    orbit.enabled = true;
    orbit.target.copy(c);
    stage.classList.remove('touring');
  };

  const panel = document.createElement('div');
  panel.className = 'm-present glass-panel';
  mount(panel, html`
    <div class="row" role="group" aria-label="Hora del día">${Object.entries(env.TIME_LABELS).map(([k, l]) => html`<button type="button" class="btn sm ghost" data-time="${k}">${l}</button>`)}</div>
    <span class="m-sep"></span>
    <button type="button" class="btn sm ghost active" data-people>${icon('users')} Personas</button>
    <button type="button" class="btn sm ghost" data-tour>${icon('compass')} Recorrido</button>
    <button type="button" class="btn sm ghost" data-full>${icon('expand')} Pantalla completa</button>
    <button type="button" class="btn sm primary" data-exit>${icon('x')} Salir</button>`);
  stage.append(panel);
  applyTime(sky.mode);

  panel.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.time) applyTime(t.dataset.time);
    else if (t.hasAttribute('data-people')) { people.group.visible = !people.group.visible; t.classList.toggle('active', people.group.visible); }
    else if (t.hasAttribute('data-tour')) { if (tour) stopTour(); else startTour(); t.classList.toggle('active', Boolean(tour)); }
    else if (t.hasAttribute('data-full')) { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen?.(); }
    else if (t.hasAttribute('data-exit')) exit();
  });
  const onKey = (e) => { if (e.key === 'Escape' && tour) { stopTour(); panel.querySelector('[data-tour]').classList.remove('active'); } };
  document.addEventListener('keydown', onKey);

  // Vista inicial: a la altura del andén, como una foto de render.
  const far = Math.max(radius, size.y) * 1.35 + 10;
  camera.position.set(c.x - far * 0.75, Math.max(5, size.y * 0.35), b.max.z + far);
  orbit.target.set(c.x, size.y * 0.45, c.z);
  orbit.update();

  const look = new THREE.Vector3();
  function update(dt) {
    cars.update(dt);
    if (people.group.visible) people.update(dt);
    if (tour) {
      tour.t = Math.min(1, tour.t + dt / tour.duration);
      const eased = tour.t < 0.5 ? 2 * tour.t * tour.t : 1 - (-2 * tour.t + 2) ** 2 / 2;
      tourPath.getPointAt(eased, camera.position);
      if (eased > 0.72) look.lerpVectors(tourPath.getPointAt(Math.min(1, eased + 0.02)), c, Math.min(1, (eased - 0.72) / 0.12));
      else tourPath.getPointAt(Math.min(1, eased + 0.03), look);
      camera.lookAt(look.x, eased > 0.72 ? look.y : look.y, look.z);
      if (tour.t >= 1) { stopTour(); panel.querySelector('[data-tour]').classList.remove('active'); }
    }
  }

  function exit() {
    if (document.fullscreenElement) document.exitFullscreen();
    stopTour();
    document.removeEventListener('keydown', onKey);
    composer.removePass(bloom);
    bloom.dispose();
    scene.remove(site);
    site.traverse((o) => o.geometry?.dispose());
    sky.dispose();
    scene.background = previous.background;
    scene.environment = previous.environment;
    scene.environmentIntensity = previous.intensity;
    scene.fog = previous.fog;
    renderer.toneMappingExposure = previous.exposure;
    orbit.maxDistance = previous.maxDistance;
    if (glass.emissive) { glass.emissive.setHex(glassBefore.emissive ?? 0); glass.emissiveIntensity = glassBefore.intensity ?? 1; }
    restore.forEach(([o, v]) => { o.visible = v; });
    panel.remove();
    onExit?.();
  }
  return { update, exit };
}
