// Modo presentación del modelador: el modelo sobre un terreno completo con cielo según la hora,
// calle, andenes, árboles, edificios vecinos, personas que caminan, autos y un recorrido guiado.
import { html, icon, mount } from '../ui.js';

const V = '/vendor/three';

export async function startPresentation(ctx) {
  const { THREE, renderer, scene, camera, orbit, composer, ao, stage, mats, bounds, hidden, onExit } = ctx;
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
  const previous = { background: scene.background, environment: scene.environment, intensity: scene.environmentIntensity, exposure: renderer.toneMappingExposure, fog: scene.fog, maxDistance: orbit.maxDistance, near: camera.near, far: camera.far, ao: ao?.enabled };
  // Escena grande: plano cercano más lejos (sin parpadeo de superficies) y sin la oclusión ambiental de
  // pantalla, calibrada para la escala de un edificio, que en una manzana entera dibuja halos.
  camera.near = 0.25;
  camera.far = 6000;
  camera.updateProjectionMatrix();
  if (ao) ao.enabled = false;
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
  // Árboles solo en el andén del lado del edificio: el del frente es donde se para la cámara.
  const road = kit.street(THREE, M, r, { length: Math.max(260, radius * 10), z: streetZ, treeSides: [-1] });
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
  // Vida de calle frente al lote: bancas, materas, bolardos, canecas, paradero y paso de cebra.
  {
    const [wA] = road.userData.walks;
    const place = (o, x, y, z, rot = 0) => { o.position.set(x, y, z); o.rotation.y = rot; site.add(o); return o; };
    for (const sx of [-1, 1]) place(kit.bench(THREE, M), c.x + sx * (size.x / 2 + 3), 0.15, wA - 0.9);
    for (const sx of [-1, 1]) place(kit.planter(THREE, M, r), c.x + sx * (size.x / 2 + 6.5), 0.15, wA - 0.9);
    for (let x = -3; x <= 3; x += 2) place(kit.bollard(THREE, M), c.x + x, 0.15, wA + 1.3);
    place(kit.trashBin(THREE, M), c.x + size.x / 2 + 1.4, 0.15, wA - 1);
    place(kit.busStop(THREE, M), c.x - size.x / 2 - 14, 0.15, wA - 0.8);
    site.add(kit.crosswalk(THREE, M, c.x + size.x / 2 + 9, streetZ));
  }
  scene.add(site);
  // Lo estático se fusiona por material: el recorrido y la órbita van fluidos aunque la escena sea grande.
  kit.mergeStatic(THREE, site);

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
  const people = kit.crowd(THREE, r, routes, 22, road.userData.groundAt);
  people.group.visible = true;
  site.add(people.group);
  // Personas en reposo: sentadas en las bancas, esperando el bus, conversando y con el celular.
  const bx = size.x / 2;
  const idle = kit.idlePeople(THREE, r, [
    { x: c.x - bx - 3.3, z: walkA - 0.95, rot: 0, kind: 'sit' }, { x: c.x + bx + 2.7, z: walkA - 0.95, rot: 0, kind: 'sit' },
    { x: c.x + bx + 3.4, z: walkA - 0.95, rot: 0, kind: 'sit' },
    { x: c.x - bx - 14.4, z: walkA - 1.1, rot: 0, kind: 'sit' }, { x: c.x - bx - 12.6, z: walkA + 0.2, rot: -0.5, kind: 'phone' },
    ...kit.chatSpots(r, c.x + bx + 5, b.max.z + 3, 3), ...kit.chatSpots(r, c.x - bx - 6, b.max.z + 2, 2),
    { x: c.x + 1.5, z: walkA + 0.6, rot: 2.8, kind: 'phone' },
  ].map((s) => ({ y: 0.15, ...s })));
  people.group.add(idle.group);
  const walkUpdate = people.update;
  people.update = (dt) => { walkUpdate(dt); idle.update(dt); };

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
    <button type="button" class="btn sm ghost" data-photo>${icon('camera')} Render fotorrealista</button>
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
    else if (t.hasAttribute('data-photo')) startPhoto();
    else if (t.hasAttribute('data-exit')) exit();
  });
  const onKey = (e) => { if (e.key === 'Escape' && tour) { stopTour(); panel.querySelector('[data-tour]').classList.remove('active'); } };
  document.addEventListener('keydown', onKey);

  // Vista inicial como fotografía de arquitectura: desde el andén de enfrente, en vista de tres cuartos,
  // con la cámara a nivel (verticales rectas) y distancia suficiente para que quepa todo el edificio con
  // aire alrededor.
  const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const camY = Math.min(Math.max(1.7, size.y * 0.32), 14);
  const dist = Math.max(radius * 1.6, (size.y * 1.12 - camY) / halfFov, (Math.max(size.x, size.z) * 0.75) / (halfFov * camera.aspect), 22);
  const ang = THREE.MathUtils.degToRad(28);
  camera.position.set(c.x - Math.sin(ang) * dist, camY, Math.max(c.z + Math.cos(ang) * dist, streetZ + 9));
  orbit.target.set(c.x, camY, c.z);
  orbit.update();

  // Render fotorrealista: la escena se congela y el trazado de rayos converge muestra a muestra.
  let photo = null;
  const photoBox = document.createElement('div');
  photoBox.className = 'm-photo glass-panel';
  photoBox.hidden = true;
  stage.append(photoBox);
  async function startPhoto() {
    if (photo || tour) return;
    mount(photoBox, html`<div class="m-photo-head"><b>Render fotorrealista</b><span id="ph-count">Preparando la escena…</span></div>
      <div class="m-photo-bar"><i id="ph-bar"></i></div>
      <div class="row"><button type="button" class="btn sm" data-ph-save disabled>${icon('download')} Descargar PNG</button><button type="button" class="btn sm ghost" data-ph-close>${icon('x')} Volver</button></div>`);
    photoBox.hidden = false;
    panel.hidden = true;
    const { startPhotoreal } = await import('./photoreal.js');
    try {
      photo = await startPhotoreal({
        THREE, renderer, scene, camera, orbit, sky: sky.equirect(1024),
        hide: [sky.sky],
        onProgress: (f, n) => {
          photoBox.querySelector('#ph-bar').style.transform = `scaleX(${f})`;
          photoBox.querySelector('#ph-count').textContent = f >= 1 ? `Listo · ${n} muestras` : `Calculando luz · ${n} muestras`;
          photoBox.querySelector('[data-ph-save]').disabled = n < 24;
        },
      });
    } catch (e) {
      photoBox.querySelector('#ph-count').textContent = 'Este dispositivo no admite el trazado de rayos.';
      console.error(e);
    }
    photoBox.querySelector('[data-ph-close]').onclick = stopPhoto;
    photoBox.querySelector('[data-ph-save]').onclick = () => {
      const a = document.createElement('a');
      a.href = photo.snapshot();
      a.download = 'render-civia.png';
      a.click();
    };
  }
  function stopPhoto() {
    photo?.stop();
    photo = null;
    photoBox.hidden = true;
    panel.hidden = false;
  }

  const look = new THREE.Vector3();
  function update(dt) {
    if (photo) { photo.step(); return; }
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
    stopPhoto();
    photoBox.remove();
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
    camera.near = previous.near;
    camera.far = previous.far;
    camera.updateProjectionMatrix();
    if (ao) ao.enabled = previous.ao;
    if (glass.emissive) { glass.emissive.setHex(glassBefore.emissive ?? 0); glass.emissiveIntensity = glassBefore.intensity ?? 1; }
    restore.forEach(([o, v]) => { o.visible = v; });
    panel.remove();
    onExit?.();
  }
  return { update, exit, get tracing() { return Boolean(photo); } };
}
