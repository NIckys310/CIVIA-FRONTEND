// Render fotorrealista por trazado de rayos (path tracing): la luz rebota de verdad entre superficies,
// con sombras suaves, reflejos en el vidrio e iluminación del cielo. Converge en unos segundos y la
// imagen se puede descargar. Usa three-gpu-pathtracer (MIT) sobre la misma escena del modelador.

const SKY = {
  day: { top: 0x3f6fb0, mid: 0x86aed6, bottom: 0xdfe9f2, halo: 0xfff4dc, power: 1.0 },
  dusk: { top: 0x1c2a55, mid: 0x7a6390, bottom: 0xf3a86a, halo: 0xffc58a, power: 0.8 },
  night: { top: 0x070d24, mid: 0x1b2a5c, bottom: 0x4a5f9e, halo: 0x9fb4ff, power: 0.5 },
};

/** Cielo en proyección equirectangular (el formato que el trazador usa para iluminar la escena). */
function skyTexture(THREE, mode, sunDir) {
  const s = SKY[mode] || SKY.dusk;
  const [top, mid, bottom, halo] = [s.top, s.mid, s.bottom, s.halo].map((h) => new THREE.Color(h));
  const W = 512; const H = 256;
  const data = new Float32Array(W * H * 4);
  const dir = new THREE.Vector3(); const c = new THREE.Color();
  const sun = sunDir.clone().normalize();
  for (let y = 0; y < H; y++) {
    const phi = Math.PI * (y + 0.5) / H;
    for (let x = 0; x < W; x++) {
      const theta = 2 * Math.PI * (x + 0.5) / W;
      dir.set(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      const h = Math.max(-0.2, Math.min(1, dir.y));
      if (h < 0.18) c.lerpColors(bottom, mid, THREE.MathUtils.smoothstep(h, -0.05, 0.18));
      else c.lerpColors(mid, top, THREE.MathUtils.smoothstep(h, 0.18, 0.75));
      if (dir.y < 0) c.multiplyScalar(0.35); // el suelo lejano refleja poca luz
      const d = Math.max(0, dir.dot(sun));
      const glow = d ** 24 * 0.55 + d ** 900 * 6;
      const i = ((H - 1 - y) * W + x) * 4;
      data[i] = (c.r + halo.r * glow) * s.power;
      data[i + 1] = (c.g + halo.g * glow) * s.power;
      data[i + 2] = (c.b + halo.b * glow) * s.power;
      data[i + 3] = 1;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

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

export async function startPhotoreal({ THREE, renderer, scene, camera, orbit, mode, sunDir, hide = [], onProgress, maxSamples = 320 }) {
  const [{ WebGLPathTracer }, { mergeGeometries }] = await Promise.all([
    import('/vendor/pathtracer/three-gpu-pathtracer.module.js'), import('/vendor/three/addons/utils/BufferGeometryUtils.js'),
  ]);
  const before = { environment: scene.environment, background: scene.background, fog: scene.fog, intensity: scene.environmentIntensity };
  const sky = skyTexture(THREE, mode, sunDir);
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
  tracer.bounces = 6;
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
