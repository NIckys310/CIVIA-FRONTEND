// Cielo, sol y luces según la hora del día. Lo comparten la pantalla de acceso y el modo presentación
// del modelador, para que el render se vea igual en los dos lugares.
//
// El cielo es fotográfico: panorámicas HDRI reales (Poly Haven, dominio público CC0) del cielo de día con
// nubes, del atardecer y de la noche estrellada. Se guardan como JPG con las altas luces comprimidas
// (y = x / (1 + x)); el shader invierte esa curva para recuperar el rango alto y aplica el mismo mapeo de
// tonos que el resto de la escena. La misma imagen ilumina los edificios (reflejos y luz ambiente) y el
// trazado de rayos, así que cielo, reflejos y sombras cuentan la misma historia.
// Cada panorámica viene girada para que su sol (o el resplandor del ocaso) quede en el acimut indicado,
// que es también el de la luz direccional que proyecta las sombras.

const MODES = {
  day: {
    // Relación real sol/cielo ≈ 3:1 en irradiancia: sombras con contraste, no una luz plana de estudio.
    sky: '/assets/sky/day.jpg', gain: 0.42, elevation: 48, azimuth: 330, exposure: 1.45, sun: 4.2, sunColor: 0xfff3e2,
    hemi: 0.12, env: 1.0, glow: 0.1, sunDisc: 1,
    fallback: { top: 0x3f6fb0, mid: 0x86aed6, bottom: 0xdfe9f2 },
  },
  dusk: {
    sky: '/assets/sky/dusk.jpg', gain: 0.16, elevation: 8, azimuth: 200, exposure: 1.2, sun: 1.4, sunColor: 0xffb27a,
    hemi: 0.08, env: 1.0, glow: 1.5, sunDisc: 0.25,
    fallback: { top: 0x1c2a55, mid: 0x7a6390, bottom: 0xf3a86a },
  },
  night: {
    sky: '/assets/sky/night.jpg', gain: 0.016, elevation: 38, azimuth: 160, exposure: 1.5, sun: 0.3, sunColor: 0xa9bcff,
    hemi: 0.05, env: 1.0, glow: 2.6, sunDisc: 0,
    fallback: { top: 0x070d24, mid: 0x1b2a5c, bottom: 0x4a5f9e },
  },
};

export const TIME_LABELS = { day: 'Día', dusk: 'Atardecer', night: 'Noche' };

/** Hora del día según el reloj: así la escena coincide con lo que la persona ve por la ventana. */
export function currentTimeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 19 || h < 6) return 'night';
  return h >= 17 ? 'dusk' : 'day';
}

const images = new Map();
/** Descarga (una sola vez por sesión) la panorámica de un modo. */
function loadSky(THREE, url) {
  if (!images.has(url)) {
    images.set(url, new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        // Sin mipmaps: el cielo siempre se ve ampliado y así no aparece la costura de la panorámica.
        t.generateMipmaps = false;
        t.minFilter = THREE.LinearFilter;
        t.magFilter = THREE.LinearFilter;
        resolve(t);
      }, undefined, reject);
    }).catch((e) => { images.delete(url); throw e; }));
  }
  return images.get(url);
}

const SKY_SHADER = {
  vertex: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }',
  fragment: `uniform sampler2D map; uniform float hasMap; uniform float gain;
    uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 ground; varying vec3 vDir;
    vec3 decode(vec2 uv){ vec3 y = min(texture2D(map, uv).rgb, vec3(0.9965)); return y / (1.0 - y) * gain; }
    void main(){
      vec3 d = normalize(vDir);
      vec3 c;
      if (hasMap > 0.5) {
        float u = atan(d.z, d.x) * 0.15915494 + 0.5;
        // La imagen solo guarda el hemisferio superior: v = 0 en el horizonte y 1 en el cenit.
        float v = asin(clamp(d.y, 0.0, 1.0)) * 0.63661977;
        c = decode(vec2(u, max(v, 0.002)));
        // Bajo el horizonte: la bruma del horizonte se funde con un suelo lejano más oscuro.
        if (d.y < 0.0) c = mix(c, ground, smoothstep(0.0, -0.12, d.y));
      } else {
        float h = clamp(d.y, -0.2, 1.0);
        c = h < 0.18 ? mix(bottom, mid, smoothstep(-0.05, 0.18, h)) : mix(mid, top, smoothstep(0.18, 0.75, h));
      }
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

/**
 * Prepara cielo, sol, luz ambiente y niebla. Devuelve { setTime, sun, glow(), ready, equirect() } donde
 * glow() es la intensidad que deben usar las ventanas iluminadas y ready se resuelve cuando el cielo
 * fotográfico ya está cargado y aplicado.
 */
export function createEnvironment(THREE, _unused, renderer, scene, { mode = 'dusk', shadowSize = 60 } = {}) {
  const uniforms = {
    map: { value: null }, hasMap: { value: 0 }, gain: { value: 1 },
    top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bottom: { value: new THREE.Color() },
    ground: { value: new THREE.Color() },
  };
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: SKY_SHADER.vertex, fragmentShader: SKY_SHADER.fragment,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 64, 32), skyMaterial);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  // El cielo acompaña a la cámara: nunca se recorta con el plano lejano ni se acerca al moverse.
  sky.onBeforeRender = (_r, _s, cam) => { sky.position.copy(cam.position); sky.updateMatrixWorld(); };
  scene.add(sky);

  // Mapeo de tonos AgX: colores y luces altas más parecidos a una fotografía que ACES.
  const toneBefore = renderer.toneMapping;
  renderer.toneMapping = THREE.AgXToneMapping;
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.radius = 2.5;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.035;
  Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 600 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xdfe8f5, 0x3a3328, 0.1);
  scene.add(hemi);
  scene.fog = new THREE.Fog(0x9a8a9a, 140, 900);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), skyMaterial);
  envScene.add(envSky);
  let envTarget = null;
  let glow = 1;
  let current = null;
  let token = 0;
  const sunDir = new THREE.Vector3(0, 1, 0);

  /** Color medio del horizonte de la panorámica (en lineal), para la niebla y el suelo lejano. */
  function horizonColor(texture, gain) {
    const img = texture.image;
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 16;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, 64, 16);
    const px = g.getImageData(0, 13, 64, 3).data; // filas junto al horizonte (abajo de la imagen)
    const acc = [0, 0, 0];
    const lin = (v) => { const s = v / 255; const y = s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; const m = Math.min(y, 0.9965); return (m / (1 - m)) * gain; };
    for (let i = 0; i < px.length; i += 4) for (let k = 0; k < 3; k++) acc[k] += lin(px[i + k]);
    const n = px.length / 4;
    return new THREE.Color().setRGB(acc[0] / n, acc[1] / n, acc[2] / n, THREE.LinearSRGBColorSpace);
  }

  function rebuildEnv() {
    envTarget?.dispose();
    envTarget = pmrem.fromScene(envScene, 0.015);
    scene.environment = envTarget.texture;
  }

  function applyPhoto(m, texture) {
    uniforms.map.value = texture;
    uniforms.hasMap.value = 1;
    uniforms.gain.value = m.gain;
    const h = horizonColor(texture, m.gain);
    uniforms.ground.value.copy(h).multiplyScalar(0.45);
    scene.fog.color.copy(h);
    hemi.color.copy(h).multiplyScalar(1 / Math.max(0.001, Math.max(h.r, h.g, h.b)));
    rebuildEnv();
  }

  let ready = Promise.resolve();
  function setTime(next) {
    const key = MODES[next] ? next : 'dusk';
    const m = MODES[key];
    current = key;
    const my = ++token;
    const phi = THREE.MathUtils.degToRad(90 - m.elevation);
    const theta = THREE.MathUtils.degToRad(m.azimuth);
    sunDir.setFromSphericalCoords(1, phi, theta);
    // De noche la luz principal es la luna: más alta y fría.
    sun.position.copy(sunDir).multiplyScalar(220).add(sun.target.position);
    sun.color.setHex(m.sunColor);
    sun.intensity = m.sun;
    hemi.intensity = m.hemi;
    renderer.toneMappingExposure = m.exposure;
    scene.environmentIntensity = m.env;
    glow = m.glow;
    // Mientras llega la foto se muestra un degradado con los tonos de esa hora.
    uniforms.top.value.setHex(m.fallback.top);
    uniforms.mid.value.setHex(m.fallback.mid);
    uniforms.bottom.value.setHex(m.fallback.bottom);
    scene.fog.color.setHex(m.fallback.bottom);
    ready = loadSky(THREE, m.sky).then((tex) => { if (my === token) applyPhoto(m, tex); }).catch(() => {
      if (my !== token) return;
      uniforms.hasMap.value = 0;
      rebuildEnv();
    });
    if (!uniforms.hasMap.value) rebuildEnv();
    return ready;
  }
  setTime(mode);

  /**
   * Panorámica completa en coma flotante para el trazado de rayos. El trazador ya incluye la luz
   * direccional del sol; withSun añade además un disco solar con su misma energía (para usarlo sin ella).
   */
  function equirect(width = 1024, { withSun = false } = {}) {
    const m = MODES[current];
    const tex = uniforms.map.value;
    const W = width; const H = width / 2;
    const data = new Float32Array(W * H * 4);
    let src = null; let sw = 0; let sh = 0;
    if (uniforms.hasMap.value && tex?.image) {
      sw = W; sh = H / 2;
      const cv = document.createElement('canvas');
      cv.width = sw; cv.height = sh;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(tex.image, 0, 0, sw, sh);
      src = g.getImageData(0, 0, sw, sh).data;
    }
    const lut = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const s = i / 255; const y = Math.min(s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4, 0.9965); lut[i] = (y / (1 - y)) * m.gain; }
    const ground = uniforms.ground.value;
    const sunC = new THREE.Color(m.sunColor);
    // Lóbulo cos^900: ángulo sólido ≈ 2π/901. Radiancia = irradiancia de la luz / ángulo sólido.
    const sunL = withSun && m.sunDisc ? (m.sun * 901) / (2 * Math.PI) : 0;
    const d = new THREE.Vector3();
    for (let y = 0; y < H; y++) {
      const v = (y + 0.5) / H; // en una DataTexture (flipY = false) la fila 0 es la de abajo
      const lat = (v - 0.5) * Math.PI;
      for (let x = 0; x < W; x++) {
        const u = (x + 0.5) / W;
        const lon = (u - 0.5) * 2 * Math.PI;
        d.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
        const o = (y * W + x) * 4;
        let r; let g; let b;
        if (src) {
          const vv = Math.max(0.002, Math.asin(Math.max(0, d.y)) / (Math.PI / 2));
          const sy = Math.min(sh - 1, Math.floor((1 - vv) * sh));
          const i = (sy * sw + Math.min(sw - 1, x)) * 4;
          r = lut[src[i]]; g = lut[src[i + 1]]; b = lut[src[i + 2]];
          if (d.y < 0) { const t = Math.min(1, -d.y / 0.12); r += (ground.r - r) * t; g += (ground.g - g) * t; b += (ground.b - b) * t; }
        } else {
          r = uniforms.mid.value.r; g = uniforms.mid.value.g; b = uniforms.mid.value.b;
        }
        if (sunL) {
          const k = Math.max(0, d.dot(sunDir)) ** 900 * sunL;
          r += sunC.r * k; g += sunC.g * k; b += sunC.b * k;
        }
        data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 1;
      }
    }
    const out = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
    out.mapping = THREE.EquirectangularReflectionMapping;
    out.minFilter = THREE.LinearFilter;
    out.magFilter = THREE.LinearFilter;
    out.needsUpdate = true;
    return out;
  }

  return {
    sun,
    sky,
    hemi,
    setTime,
    equirect,
    get ready() { return ready; },
    get mode() { return current; },
    get sunDir() { return sunDir.clone(); },
    glow: () => glow,
    dispose() {
      token++;
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
