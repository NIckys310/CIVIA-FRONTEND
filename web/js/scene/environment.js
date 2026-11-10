// Cielo físico, sol y luces según la hora del día. Lo comparten la pantalla de acceso y el modo
// presentación del modelador, para que el render se vea igual en los dos lugares.

const MODES = {
  // Cielo en degradado (cenit, franja media y horizonte) con un halo alrededor del sol. El acimut se mide
  // desde +Z (la fachada principal): de día el sol ilumina el frente; al atardecer queda detrás de los edificios.
  day: { elevation: 40, azimuth: 330, top: 0x3f6fb0, mid: 0x86aed6, bottom: 0xdfe9f2, halo: 0xfff4dc, exposure: 1.25, sun: 3.2, sunColor: 0xfff1e0, hemi: 0.75, fog: 0xc9d6e2, glow: 0.12 },
  dusk: { elevation: 6, azimuth: 200, top: 0x1c2a55, mid: 0x7a6390, bottom: 0xf3a86a, halo: 0xffc58a, exposure: 1.3, sun: 1.8, sunColor: 0xffaa6a, hemi: 0.5, fog: 0x6e5d72, glow: 1.6 },
  night: { elevation: 25, azimuth: 160, top: 0x070d24, mid: 0x1b2a5c, bottom: 0x4a5f9e, halo: 0x9fb4ff, exposure: 1.35, sun: 0.5, sunColor: 0x9fb4ff, hemi: 0.28, fog: 0x1b2448, glow: 2.6 },
};

export const TIME_LABELS = { day: 'Día', dusk: 'Atardecer', night: 'Noche' };

/** Hora del día según el reloj: así la escena coincide con lo que la persona ve por la ventana. */
export function currentTimeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 19 || h < 6) return 'night';
  return h >= 17 ? 'dusk' : 'day';
}

/**
 * Prepara cielo, sol, luz ambiente y niebla. Devuelve { setTime, sun, glow() } donde glow() es la
 * intensidad que deben usar las ventanas iluminadas.
 */
export function createEnvironment(THREE, Sky, renderer, scene, { mode = 'dusk', shadowSize = 60 } = {}) {
  const uniforms = {
    top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
    halo: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) },
  };
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 halo; uniform vec3 sunDir; varying vec3 vDir;
      void main(){
        float h = clamp(vDir.y, -0.2, 1.0);
        vec3 c = h < 0.18 ? mix(bottom, mid, smoothstep(-0.05, 0.18, h)) : mix(mid, top, smoothstep(0.18, 0.75, h));
        float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
        c += halo * (pow(s, 24.0) * 0.55 + pow(s, 900.0) * 1.2);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 16), skyMaterial);
  sky.frustumCulled = false;
  scene.add(sky);

  // Mapeo de tonos AgX: colores y luces altas más parecidos a una fotografía que ACES.
  renderer.toneMapping = THREE.AgXToneMapping;
  const toneBefore = THREE.ACESFilmicToneMapping;
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.radius = 3;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 400 });
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xdfe8f5, 0x3a3328, 0.4);
  scene.add(hemi);
  scene.fog = new THREE.Fog(0x9a8a9a, 140, 900);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMaterial);
  envScene.add(envSky);
  let envTarget = null;
  let glow = 1;
  let current = null;

  function setTime(next) {
    const m = MODES[next] || MODES.dusk;
    current = next;
    const phi = THREE.MathUtils.degToRad(90 - m.elevation);
    const theta = THREE.MathUtils.degToRad(m.azimuth);
    const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
    uniforms.top.value.setHex(m.top);
    uniforms.mid.value.setHex(m.mid);
    uniforms.bottom.value.setHex(m.bottom);
    uniforms.halo.value.setHex(m.halo);
    uniforms.sunDir.value.copy(dir);
    // De noche la luz principal es la luna: sale del lado opuesto y más alta.
    const light = dir.clone();
    if (light.y < 0.12) light.y = 0.12;
    sun.position.copy(light.multiplyScalar(160));
    sun.color.setHex(m.sunColor);
    sun.intensity = m.sun;
    hemi.intensity = m.hemi;
    scene.fog.color.setHex(m.fog);
    renderer.toneMappingExposure = m.exposure;
    envTarget?.dispose();
    envTarget = pmrem.fromScene(envScene, 0.02);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = next === 'night' ? 0.35 : 0.8;
    glow = m.glow;
  }
  setTime(mode);

  return {
    sun,
    sky,
    setTime,
    get mode() { return current; },
    glow: () => glow,
    dispose() {
      renderer.toneMapping = toneBefore;
      envTarget?.dispose();
      pmrem.dispose();
      sky.geometry.dispose();
      skyMaterial.dispose();
      envSky.geometry.dispose();
      scene.remove(sky, sun, sun.target, hemi);
    },
  };
}
