// Render fotorrealista por trazado de rayos (path tracing): la luz rebota de verdad entre superficies,
// con sombras suaves, reflejos en el vidrio e iluminación del cielo. Converge en unos segundos y la
// imagen se puede descargar. Usa three-gpu-pathtracer (MIT) sobre la misma escena del modelador y
// la misma panorámica HDRI del cielo que se ve en la presentación (environment.equirect()).

/** Las mallas instanciadas se convierten en geometría normal: el trazador solo lee mallas simples. */
function expandInstances(THREE, scene) {
  const created = [];
  scene.traverse((o) => {
    if (!o.isInstancedMesh || !o.visible || !o.count) return;
    const m = new THREE.Matrix4();
    const parts = [];
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, m);
      parts.push(o.geometry.clone().applyMatrix4(m));
    }
    created.push({ o, parts });
  });
  return created;
}

export async function startPhotoreal({ THREE, renderer, scene, camera, orbit, sky, hide = [], onProgress, maxSamples = 400 }) {
  const [{ WebGLPathTracer }, { mergeGeometries }] = await Promise.all([
    import('/vendor/pathtracer/three-gpu-pathtracer.module.js'), import('/vendor/three/addons/utils/BufferGeometryUtils.js'),
  ]);
  const before = { environment: scene.environment, background: scene.background, fog: scene.fog, intensity: scene.environmentIntensity };
  scene.environment = sky;
  scene.background = sky;
  scene.environmentIntensity = 1;
  scene.fog = null;
  const hidden = hide.filter(Boolean).map((o) => [o, o.visible]);
  hidden.forEach(([o]) => { o.visible = false; });

  // Instancias → mallas fusionadas temporales.
  const temps = [];
  for (const { o, parts } of expandInstances(THREE, scene)) {
    const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
    parts.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, o.material);
    mesh.matrixAutoUpdate = false;
    mesh.matrix.copy(o.matrixWorld);
    scene.add(mesh);
    temps.push({ mesh, o, visible: o.visible });
    o.visible = false;
  }

  const tracer = new WebGLPathTracer(renderer);
  tracer.bounces = 8;
  tracer.transmissiveBounces = 6;
  tracer.filterGlossyFactor = 0.4;
  tracer.minSamples = 1;
  tracer.renderDelay = 0;
  tracer.fadeDuration = 0;
  tracer.tiles.set(2, 2);
  scene.updateMatrixWorld(true);
  tracer.setScene(scene, camera);
  const onMove = () => tracer.updateCamera();
  orbit.addEventListener('change', onMove);

  let stopped = false;
  return {
    get samples() { return Math.floor(tracer.samples); },
    get done() { return tracer.samples >= maxSamples; },
    step() {
      if (stopped || tracer.samples >= maxSamples) return;
      tracer.renderSample();
      onProgress?.(Math.min(1, tracer.samples / maxSamples), Math.floor(tracer.samples));
    },
    snapshot: () => renderer.domElement.toDataURL('image/png'),
    stop() {
      if (stopped) return;
      stopped = true;
      orbit.removeEventListener('change', onMove);
      try { tracer.dispose(); } catch { /* la versión 0.0.23 falla al liberar recursos que no creó */ }
      temps.forEach(({ mesh, o, visible }) => { scene.remove(mesh); mesh.geometry.dispose(); o.visible = visible; });
      hidden.forEach(([o, v]) => { o.visible = v; });
      sky.dispose();
      Object.assign(scene, { environment: before.environment, background: before.background, fog: before.fog, environmentIntensity: before.intensity });
    },
  };
}
