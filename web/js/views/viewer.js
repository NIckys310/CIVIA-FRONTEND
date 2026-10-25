// Visor y modelado 3D (Three.js): modelos del proyecto, medición, notas, sección, sol y volumetría con IA.
import { api, fileUrl, upload } from '../api.js';
import { $, busy, fmtBytes, fmtNum, html, icon, mount, on, relTime, toast } from '../ui.js';
import { fieldRules, live } from '../validate.js';

const THREE_URL = '/vendor/three/three.module.min.js';

export async function render(el, { docId, projectId, massing }) {
  if (!docId && !massing) return picker(el);

  mount(el, html`
  <div class="page-head" style="margin-bottom:16px">
    <div><div class="eyebrow gold">${massing ? 'Volumetría con IA' : 'Visor 3D'}</div><h1 id="v-title" style="font-size:30px">${massing ? 'Masa del proyecto' : 'Cargando modelo…'}</h1></div>
    <div class="row wrap" id="v-actions"></div>
  </div>
  <div class="viewer" id="viewer">
    <div class="loading" id="v-loading"><div class="stack" style="align-items:center"><div class="spinner" style="width:28px;height:28px"></div><span class="hint" id="v-progress">Preparando el visor…</span></div></div>
    <div class="hud tl glass-panel" style="padding:6px" id="v-tools"></div>
    <div class="hud bl glass-panel" style="padding:10px 14px;gap:14px;align-items:center" id="v-sun">
      <span class="row" style="gap:6px">${icon('sun')}<span class="hint">Sol</span></span>
      <input type="range" min="6" max="18" step="0.25" value="15" id="sun-hour" aria-label="Hora del día">
      <span class="mono hint" id="sun-label">15:00</span>
      <span class="row" style="gap:6px">${icon('cut')}<span class="hint">Sección</span></span>
      <input type="range" min="0" max="1" step="0.01" value="1" id="section" aria-label="Plano de sección">
    </div>
    <div class="panel glass-panel" id="v-panel"></div>
  </div>`);

  const [THREE, { OrbitControls }] = await Promise.all([
    import(THREE_URL), import('/vendor/three/addons/controls/OrbitControls.js'),
  ]);
  const ctx = createScene(THREE, OrbitControls, $('#viewer', el));
  setupTools(THREE, ctx, el);

  if (massing) {
    await massingMode(THREE, ctx, el, projectId);
  } else {
    await modelMode(THREE, ctx, el, docId);
  }
  return () => ctx.dispose();
}

// ------------------------------------------------------------------ selector

async function picker(el) {
  mount(el, html`<div class="page-head"><div><div class="eyebrow gold">Modelado 3D</div><h1>Modelos y volumetrías</h1>
    <p class="muted">Abre un modelo de tus proyectos o genera una volumetría con IA a partir del lote.</p></div></div>
    <div class="card skeleton" style="height:240px"></div>`);
  const projects = await api.get('/projects');
  const lists = await Promise.all(projects.map((p) => api.get(`/projects/${p.id}/documents?kind=MODEL_3D`).then((d) => d.map((x) => ({ ...x, project: p })))));
  const models = lists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  mount(el, html`<div class="page-head"><div><div class="eyebrow gold">Modelado 3D</div><h1>Modelos y volumetrías</h1>
    <p class="muted">Abre un modelo de tus proyectos o genera una volumetría con IA a partir del lote.</p></div></div>
    <div class="split">
      <div class="card"><div class="card-head"><h3>Modelos 3D</h3><span class="pill">${models.length}</span></div>
        <div class="card-body" style="padding:10px">${models.length ? models.map((m) => html`
          <a class="file-row" href="${['glb', 'gltf', 'obj', 'stl'].includes(m.extension) ? `#/viewer/${m.id}` : `#/projects/${m.project.id}/files`}">
            <div class="file-ico model">${m.extension}</div>
            <div style="min-width:0"><div class="name">${m.name}</div><div class="sub">${m.project.name} · ${fmtBytes(m.sizeBytes)} · ${relTime(m.createdAt)}</div></div>
            <span class="btn sm">${icon('cube')} Abrir</span></a>`)
          : html`<div class="empty">${icon('cube', 'big')}<p>Aún no hay modelos. Súbelos en la pestaña Archivos de un proyecto (GLB, OBJ, STL…).</p></div>`}</div></div>
      <div class="card glow pad"><div class="eyebrow gold">Volumetría con IA</div><h3 style="margin:10px 0 8px">Genera la masa máxima del lote</h3>
        <p class="muted" style="font-size:13px;margin-bottom:16px">CIVIA calcula huella, pisos y área según índices de ocupación y construcción, retiros y altura.</p>
        ${projects.length ? html`<div class="stack">${projects.slice(0, 8).map((p) => html`<a class="btn block" href="#/massing/${p.id}" style="justify-content:space-between">${p.name}${icon('chevron')}</a>`)}</div>`
          : html`<a class="btn primary" href="#/projects?new">${icon('plus')} Crea un proyecto</a>`}
      </div>
    </div>`);
}

// ------------------------------------------------------------------ escena

function createScene(THREE, OrbitControls, host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  host.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07080b, 120, 420);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 2000);
  camera.position.set(28, 20, 32);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;

  scene.add(new THREE.HemisphereLight(0xdfe6f5, 0x1a1410, 0.75));
  const sun = new THREE.DirectionalLight(0xfff1de, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  const rim = new THREE.PointLight(0xd6a46c, 40, 0, 1.6);
  scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.ShadowMaterial({ opacity: 0.35 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = '__ground';
  scene.add(ground);
  const grid = new THREE.GridHelper(400, 400, 0x3a3f4a, 0x1a1d24);
  grid.material.transparent = true;
  grid.material.opacity = 0.55;
  scene.add(grid);

  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6);
  const root = new THREE.Group();
  scene.add(root);

  const labels = [];
  let raf = 0;
  let radius = 20;

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    // Con el panel lateral abierto, el modelo se centra en el espacio libre de la izquierda.
    const panel = host.querySelector('#v-panel');
    const shift = panel && !panel.hidden && w > 760 ? Math.min(panel.offsetWidth + 14, w * 0.45) / 2 : 0;
    if (shift) camera.setViewOffset(w, h, shift, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const v = new THREE.Vector3();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
    const w = host.clientWidth;
    const h = host.clientHeight;
    for (const l of labels) {
      v.copy(l.position).project(camera);
      const visible = v.z < 1 && v.z > -1;
      l.el.style.display = visible ? '' : 'none';
      l.el.style.left = `${((v.x + 1) / 2) * w}px`;
      l.el.style.top = `${((1 - v.y) / 2) * h}px`;
    }
  };
  loop();

  const ctx = {
    THREE, renderer, scene, camera, controls, sun, rim, root, clip, host, labels, ground, grid,
    bounds: new THREE.Box3(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 5, 5)),
    setSunHour(hour) {
      // Trayectoria aproximada: el sol sale por el oriente (x+) y se pone por occidente (x-).
      const t = (hour - 6) / 12;
      const az = Math.PI * t;
      const el = Math.sin(Math.PI * t) * 1.15 + 0.08;
      const d = radius * 3;
      sun.position.set(Math.cos(az) * d, Math.sin(el) * d, -Math.sin(az) * d * 0.45 + d * 0.35);
      sun.intensity = 0.6 + Math.sin(Math.PI * t) * 2.2;
      sun.color.setHSL(0.09, 0.6, 0.62 + Math.sin(Math.PI * t) * 0.3);
    },
    frame(box) {
      ctx.bounds = box.clone();
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      radius = Math.max(size.x, size.y, size.z, 1);
      camera.position.set(center.x + radius * 1.25, center.y + radius * 0.9, center.z + radius * 1.4);
      camera.near = radius / 500;
      camera.far = radius * 60;
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      controls.update();
      const s = sun.shadow.camera;
      s.left = -radius * 1.5; s.right = radius * 1.5; s.top = radius * 1.5; s.bottom = -radius * 1.5;
      s.near = 0.1; s.far = radius * 8;
      s.updateProjectionMatrix();
      sun.target.position.copy(center);
      rim.position.set(center.x - radius, center.y + radius * 0.8, center.z - radius);
      rim.intensity = radius * 2.5;
      scene.fog.near = radius * 6;
      scene.fog.far = radius * 18;
      grid.scale.setScalar(Math.max(1, Math.round(radius / 20)));
      ctx.setSunHour(Number(document.getElementById('sun-hour')?.value || 15));
    },
    addLabel(position, text, cls = '') {
      const elx = document.createElement('div');
      elx.className = `label3d ${cls}`;
      elx.textContent = text;
      host.appendChild(elx);
      const l = { position: position.clone(), el: elx };
      labels.push(l);
      return l;
    },
    clearLabels(cls) {
      for (let i = labels.length - 1; i >= 0; i--) {
        if (!cls || labels[i].el.classList.contains(cls)) { labels[i].el.remove(); labels.splice(i, 1); }
      }
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m?.dispose?.());
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
  return ctx;
}

function setupTools(THREE, ctx, el) {
  ctx.tool = 'orbit';
  const tools = [['orbit', 'rotate', 'Orbitar'], ['measure', 'ruler', 'Medir'], ['note', 'note', 'Nota'], ['wire', 'wire', 'Alámbrico'], ['reset', 'expand', 'Encuadrar'], ['shot', 'image', 'Captura'], ['panel', 'sliders', 'Mostrar u ocultar panel']];
  mount($('#v-tools', el), html`${tools.map(([k, ic, label]) => html`<button class="btn ghost icon sm tool ${k === 'orbit' || k === 'panel' ? 'active' : ''}" data-tool="${k}" title="${label}" aria-label="${label}">${icon(ic)}</button>`)}`);
  let measurePts = [];
  let measureObjs = [];

  on($('#v-tools', el), 'click', '[data-tool]', (e, b) => {
    const t = b.dataset.tool;
    if (t === 'reset') { ctx.frame(ctx.bounds); return; }
    if (t === 'panel') {
      const panel = $('#v-panel', el);
      panel.hidden = !panel.hidden;
      b.classList.toggle('active', !panel.hidden);
      ctx.resize();
      return;
    }
    if (t === 'shot') {
      const a = document.createElement('a');
      a.href = ctx.renderer.domElement.toDataURL('image/png');
      a.download = 'civia-3d.png';
      a.click();
      return;
    }
    if (t === 'wire') {
      b.classList.toggle('active');
      ctx.root.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.wireframe = b.classList.contains('active'); }); });
      return;
    }
    ctx.tool = t;
    el.querySelectorAll('[data-tool="orbit"],[data-tool="measure"],[data-tool="note"]').forEach((x) => x.classList.toggle('active', x === b));
    if (t !== 'measure') { measurePts = []; }
    toast(t === 'measure' ? 'Haz clic en dos puntos del modelo para medir.' : t === 'note' ? 'Haz clic en el modelo para anclar una nota.' : 'Modo órbita', 'info');
  });

  const sunInput = $('#sun-hour', el);
  sunInput.addEventListener('input', () => {
    const hr = Number(sunInput.value);
    $('#sun-label', el).textContent = `${String(Math.floor(hr)).padStart(2, '0')}:${String(Math.round((hr % 1) * 60)).padStart(2, '0')}`;
    ctx.setSunHour(hr);
  });
  $('#section', el).addEventListener('input', (e) => {
    const b = ctx.bounds;
    const v = Number(e.target.value);
    ctx.clip.constant = v >= 0.999 ? 1e6 : b.min.y + (b.max.y - b.min.y) * v;
  });

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  ctx.renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  ctx.renderer.domElement.addEventListener('pointerup', async (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5 || ctx.tool === 'orbit') return;
    const r = ctx.renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, ctx.camera);
    const hit = ray.intersectObjects([ctx.root, ctx.ground], true).find((h) => h.object.visible && !h.object.userData.helper);
    if (!hit) return;
    if (ctx.tool === 'measure') {
      measurePts.push(hit.point.clone());
      const dot = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.03, ctx.bounds.getSize(new THREE.Vector3()).length() / 300), 12, 12), new THREE.MeshBasicMaterial({ color: 0xf2cf9f }));
      dot.position.copy(hit.point);
      dot.userData.helper = true;
      ctx.scene.add(dot);
      measureObjs.push(dot);
      if (measurePts.length === 2) {
        const [a, b2] = measurePts;
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b2]), new THREE.LineBasicMaterial({ color: 0xd6a46c }));
        line.userData.helper = true;
        ctx.scene.add(line);
        measureObjs.push(line);
        const dist = a.distanceTo(b2) / (ctx.unitScale || 1);
        ctx.addLabel(a.clone().add(b2).multiplyScalar(0.5), `${fmtNum(dist, 2)} m`, 'measure');
        measurePts = [];
      }
    } else if (ctx.tool === 'note' && ctx.onNote) {
      ctx.onNote(hit.point);
    }
  });
  ctx.clearMeasures = () => {
    measureObjs.forEach((o) => ctx.scene.remove(o));
    measureObjs = [];
    ctx.clearLabels('measure');
  };
}

function applyClipping(ctx, object) {
  object.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      m.clippingPlanes = [ctx.clip];
      m.clipShadows = true;
      m.side = m.side ?? ctx.THREE.FrontSide;
    });
  });
}

// ------------------------------------------------------------------ modelos

async function modelMode(THREE, ctx, el, docId) {
  const doc = await api.get(`/documents/${docId}`);
  $('#v-title', el).textContent = doc.name;
  const url = await fileUrl(docId, doc);
  const ext = doc.extension;
  $('#v-progress', el).textContent = `Cargando ${ext.toUpperCase()} (${fmtBytes(doc.sizeBytes)})…`;

  let object;
  try {
    if (ext === 'glb' || ext === 'gltf') {
      const { GLTFLoader } = await import('/vendor/three/addons/loaders/GLTFLoader.js');
      object = (await new GLTFLoader().loadAsync(url)).scene;
    } else if (ext === 'obj') {
      const { OBJLoader } = await import('/vendor/three/addons/loaders/OBJLoader.js');
      object = await new OBJLoader().loadAsync(url);
      object.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ color: 0xd9dbe0, roughness: 0.7, metalness: 0.05 }); });
    } else if (ext === 'stl') {
      const { STLLoader } = await import('/vendor/three/addons/loaders/STLLoader.js');
      const geo = await new STLLoader().loadAsync(url);
      geo.computeVertexNormals();
      object = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xd9dbe0, roughness: 0.6, metalness: 0.1 }));
      object.rotation.x = -Math.PI / 2; // STL suele venir con Z hacia arriba
    } else {
      throw new Error(`El formato .${ext} no se puede ver en el navegador. Expórtalo a GLB, OBJ o STL.`);
    }
  } catch (e) {
    mount($('#v-loading', el), html`<div class="empty">${icon('alert', 'big')}<p>${e.message || 'No se pudo abrir el modelo.'}</p>
      ${ext === 'gltf' ? html`<p class="hint">Si el .gltf usa archivos .bin o texturas externas, súbelo como .glb (todo en uno).</p>` : ''}</div>`);
    return;
  }

  // Estadísticas en unidades del archivo (la IA deduce las unidades).
  const rawBox = new THREE.Box3().setFromObject(object);
  const rawSize = rawBox.getSize(new THREE.Vector3());
  let triangles = 0;
  let vertices = 0;
  let meshes = 0;
  const materials = new Set();
  const textures = new Set();
  const names = new Set();
  object.traverse((o) => {
    if (o.name) names.add(o.name);
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    const count = g.index ? g.index.count : g.attributes.position.count;
    triangles += Math.floor(count / 3);
    vertices += g.attributes.position.count;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      materials.add(m.uuid);
      if (m.name) names.add(m.name);
      ['map', 'normalMap', 'roughnessMap'].forEach((k) => m[k] && textures.add(m[k].uuid));
    });
  });

  // Escala de visualización a metros y apoyo sobre el suelo.
  const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
  ctx.unitScale = maxDim > 2000 ? 0.001 : maxDim > 300 ? 0.01 : 1;
  const wrapper = new THREE.Group();
  wrapper.add(object);
  wrapper.scale.setScalar(ctx.unitScale);
  ctx.root.add(wrapper);
  const box = new THREE.Box3().setFromObject(wrapper);
  const c = box.getCenter(new THREE.Vector3());
  wrapper.position.set(-c.x, -box.min.y, -c.z);
  applyClipping(ctx, wrapper);
  ctx.unitScale = 1; // a partir de aquí todo está en metros
  const finalBox = new THREE.Box3().setFromObject(wrapper);
  ctx.frame(finalBox);
  $('#v-loading', el).remove();

  const size = finalBox.getSize(new THREE.Vector3());
  const stats = {
    fileName: doc.name, format: ext, sizeBytes: doc.sizeBytes, triangles, vertices, meshes,
    materials: materials.size, textures: textures.size, sizeX: rawSize.x, sizeY: rawSize.y, sizeZ: rawSize.z,
    objectNames: [...names].slice(0, 300),
  };

  mount($('#v-actions', el), html`<a class="btn" href="#/projects/${doc.projectId}/files">${icon('back')} Proyecto</a>
    <button class="btn primary" id="ai-model" data-busy="Analizando…">${icon('sparkle')} Analizar con IA</button>`);
  const drawPanel = (analysis) => mount($('#v-panel', el), html`
    <div class="eyebrow gold">Modelo</div>
    <div class="display" style="font-size:22px;margin:8px 0 14px">${fmtNum(size.x, 1)} × ${fmtNum(size.z, 1)} × ${fmtNum(size.y, 1)} m</div>
    <table class="table" style="font-size:12.5px"><tbody>
      ${[['Triángulos', triangles.toLocaleString('es')], ['Vértices', vertices.toLocaleString('es')], ['Mallas', meshes], ['Materiales', materials.size], ['Texturas', textures.size],
        ['Pisos aprox.', Math.max(1, Math.round(size.y / 3))], ['Huella', `${fmtNum(size.x * size.z, 1)} m²`]]
        .map(([k, v]) => html`<tr><td class="faint" style="padding:7px 0">${k}</td><td class="num" style="padding:7px 0">${v}</td></tr>`)}
    </tbody></table>
    ${analysis ? html`<div class="sep"></div><div class="eyebrow gold">CIVIA · ${analysis.engine}</div>
      <p style="font-size:13px;margin:8px 0">${analysis.summary}</p>
      ${(analysis.result?.recommendations || []).slice(0, 8).map((r) => html`<div class="rec ${r.priority}" style="padding:10px 0"><div class="mark" style="width:24px;height:24px">${icon(r.priority === 'alta' ? 'alert' : 'sparkle')}</div>
        <div><h4 style="font-size:13px">${r.title}</h4><p style="font-size:12px">${r.detail}</p></div><span></span></div>`)}`
    : html`<p class="hint" style="margin-top:12px">Pulsa «Analizar con IA» para que CIVIA revise qué le falta al modelo.</p>`}
    <div class="sep"></div><div class="row between"><span class="eyebrow">Notas</span><span class="pill" id="note-count">0</span></div>
    <div id="notes" class="stack" style="margin-top:10px"></div>`);
  drawPanel();

  $('#ai-model', el).onclick = (e) => busy(e.currentTarget, async () => {
    const analysis = await api.post(`/ai/models/${docId}/analyze`, stats);
    drawPanel(analysis);
    loadNotes();
    toast('Revisión del modelo lista');
  });

  // Notas ancladas al modelo (guardadas en el servidor).
  const loadNotes = async () => {
    const notes = await api.get(`/documents/${docId}/annotations`);
    ctx.clearLabels('note');
    notes.forEach((n) => {
      const l = ctx.addLabel(new THREE.Vector3(n.x, n.y, n.z), n.text, 'note');
      l.el.title = `${n.authorName} · ${relTime(n.createdAt)}`;
      if (n.resolved) l.el.style.opacity = '0.45';
    });
    const countEl = $('#note-count', el);
    if (countEl) countEl.textContent = notes.length;
    const list = $('#notes', el);
    if (list) mount(list, html`${notes.map((n) => html`<label class="check" style="font-size:12.5px"><input type="checkbox" data-note="${n.id}" ${n.resolved ? 'checked' : ''}>${n.text}</label>`)}`);
  };
  on(el, 'change', '[data-note]', async (e, input) => {
    await api.patch(`/documents/${docId}/annotations/${input.dataset.note}`, { resolved: input.checked });
    loadNotes();
  });
  ctx.onNote = async (point) => {
    const text = window.prompt('Nota para este punto del modelo:');
    if (!text?.trim()) return;
    await api.post(`/documents/${docId}/annotations`, { x: point.x, y: point.y, z: point.z, text: text.trim() });
    loadNotes();
  };
  loadNotes();
}

// ------------------------------------------------------------------ volumetría

async function massingMode(THREE, ctx, el, projectId) {
  const project = await api.get(`/projects/${projectId}`);
  $('#v-title', el).textContent = project.name;
  $('#v-loading', el).remove();
  const lot = project.lotArea || 200;
  const defaults = { lotWidth: Math.round(Math.sqrt(lot / 2) * 10) / 10 || 10, lotDepth: Math.round(Math.sqrt(lot * 2) * 10) / 10 || 20,
    occupancyIndex: 0.7, constructionIndex: 2.4, frontSetback: 3, rearSetback: 3, sideSetback: 0, floorHeight: 2.9 };
  const PRESETS = [8, 24, 60, 120, 250];

  mount($('#v-actions', el), html`<a class="btn" href="#/projects/${projectId}">${icon('back')} Proyecto</a>
    ${project.role !== 'VIEWER' ? html`<button class="btn primary" id="save-glb" data-busy="Guardando…" disabled>${icon('upload')} Guardar como modelo 3D</button>` : ''}`);
  mount($('#v-panel', el), html`<form id="massing" class="stack massing-form" novalidate>
    <div class="eyebrow gold">Altura del edificio</div>
    <div class="field" data-field="floors">
      <label for="m-floors">Número de pisos <span class="faint">· sin límite</span></label>
      <div class="floor-stepper">
        <button type="button" class="btn icon" data-step="-1" aria-label="Quitar un piso">−</button>
        <input class="input" id="m-floors" name="floors" type="number" min="1" step="1" inputmode="numeric" placeholder="Según norma" value="${project.floors || ''}" aria-describedby="m-floors-msg">
        <button type="button" class="btn icon" data-step="1" aria-label="Agregar un piso">+</button>
      </div>
      <input type="range" id="m-floors-range" min="1" max="40" step="1" value="${project.floors || 1}" aria-label="Pisos (el rango crece a medida que subes)">
      <div class="range-ends mono"><span>1</span><span id="m-range-max">40+</span></div>
      <div class="chips presets">${PRESETS.map((n) => html`<button type="button" class="chip" data-preset="${n}">${n} pisos</button>`)}</div>
      <div class="field-msg" id="m-floors-msg" aria-live="polite"></div>
    </div>
    <div id="m-alerts" class="stack"></div>
    <div class="sep"></div>
    <div class="eyebrow gold">Lote y norma</div>
    <div class="form-grid compact">
      ${[['lotWidth', 'Frente', 'm'], ['lotDepth', 'Fondo', 'm'], ['occupancyIndex', 'Índice ocupación', 'IO'], ['constructionIndex', 'Índice construcción', 'IC'],
        ['frontSetback', 'Retiro frontal', 'm'], ['rearSetback', 'Retiro posterior', 'm'], ['sideSetback', 'Retiro lateral', 'm'], ['floorHeight', 'Altura de piso', 'm']]
        .map(([k, l, u]) => html`<div class="field"><label for="m-${k}">${l}</label><div class="input-wrap affixed"><input class="input" id="m-${k}" type="number" step="any" min="0" name="${k}" value="${defaults[k]}"><span class="affix post">${u}</span></div></div>`)}
    </div>
    <div id="m-result"></div>
  </form>`);

  const group = new THREE.Group();
  ctx.root.add(group);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xc8d4ea, metalness: 0.1, roughness: 0.08, transmission: 0.35, transparent: true, opacity: 0.55, clearcoat: 1 });
  const slab = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.55 });
  const lotMat = new THREE.MeshStandardMaterial({ color: 0x1c2027, roughness: 1 });
  const gold = new THREE.LineBasicMaterial({ color: 0xd6a46c });
  let mergeTools = null;

  const build = async (p, input) => {
    group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    group.clear();
    ctx.clearLabels('floor');
    const lotMesh = new THREE.Mesh(new THREE.BoxGeometry(input.lotWidth, 0.06, input.lotDepth), lotMat);
    lotMesh.position.y = 0.03;
    lotMesh.receiveShadow = true;
    lotMesh.name = 'Lote';
    group.add(lotMesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(input.lotWidth, 0.07, input.lotDepth)), gold);
    edges.position.y = 0.035;
    edges.userData.helper = true;
    group.add(edges);
    const x = -input.lotWidth / 2 + p.offsetX + p.footprintWidth / 2;
    const z = -input.lotDepth / 2 + p.offsetZ + p.footprintDepth / 2;
    const fh = p.floorHeight;
    const slabAt = (i) => new THREE.BoxGeometry(p.footprintWidth, 0.22, p.footprintDepth).translate(x, 0.06 + i * fh + 0.11, z);
    const glassAt = (i) => new THREE.BoxGeometry(p.footprintWidth - 0.1, fh - 0.22, p.footprintDepth - 0.1).translate(x, 0.06 + i * fh + 0.22 + (fh - 0.22) / 2, z);
    if (p.floors <= 120) {
      // Una malla por piso: el modelo exportado conserva los nombres de cada nivel.
      for (let i = 0; i < p.floors; i++) {
        const s = new THREE.Mesh(slabAt(i), slab); s.name = `Losa_N${i + 1}`;
        const g = new THREE.Mesh(glassAt(i), glass); g.name = `Fachada_Vidrio_N${i + 1}`;
        group.add(s, g);
      }
    } else {
      // Muchos pisos: se fusionan en dos mallas para que el visor siga fluido, tenga los pisos que tenga.
      mergeTools ||= await import('/vendor/three/addons/utils/BufferGeometryUtils.js');
      const slabs = []; const glasses = [];
      for (let i = 0; i < p.floors; i++) { slabs.push(slabAt(i)); glasses.push(glassAt(i)); }
      const s = new THREE.Mesh(mergeTools.mergeGeometries(slabs), slab); s.name = `Losas_N1-N${p.floors}`;
      const g = new THREE.Mesh(mergeTools.mergeGeometries(glasses), glass); g.name = `Fachada_Vidrio_N1-N${p.floors}`;
      slabs.concat(glasses).forEach((geo) => geo.dispose());
      group.add(s, g);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(p.footprintWidth + 0.3, 0.3, p.footprintDepth + 0.3), slab);
    roof.position.set(x, 0.06 + p.floors * fh + 0.15, z);
    roof.name = 'Cubierta';
    group.add(roof);
    // Etiquetas de nivel: unas 10 repartidas en la altura, siempre la primera y la última.
    const every = Math.max(1, Math.ceil(p.floors / 10));
    for (let i = 0; i < p.floors; i++) {
      if (i === 0 || (i + 1) % every === 0 || i === p.floors - 1) {
        ctx.addLabel(new THREE.Vector3(x + p.footprintWidth / 2 + 0.6, 0.06 + i * fh + fh / 2, z + p.footprintDepth / 2), `N${i + 1}`, 'floor');
      }
    }
    applyClipping(ctx, group);
    // Encuadre automático: la cámara se aleja lo necesario para ver el edificio completo.
    ctx.frame(new THREE.Box3().setFromObject(group));
  };

  const form = $('#massing', el);
  const floorsInput = $('#m-floors', el);
  const range = $('#m-floors-range', el);
  const syncRange = (n) => {
    const max = Math.max(40, Math.ceil((n * 1.5) / 20) * 20);
    range.max = String(max);
    range.value = String(n || 1);
    $('#m-range-max', el).textContent = `${max}+`;
  };
  const floorsCtl = live(floorsInput, fieldRules.integer('Pisos', { warnAbove: 1000 }));

  let seq = 0;
  const run = async () => {
    if (floorsInput.value && !floorsCtl.check().ok) return;
    const input = Object.fromEntries([...new FormData(form).entries()].map(([k, v]) => [k, Number(v) || 0]));
    input.maxFloors = 0;
    const mySeq = ++seq;
    const p = await api.post('/ai/massing', input);
    if (mySeq !== seq) return; // llegó una respuesta más nueva mientras tanto
    await build(p, input);
    if (!floorsInput.value) syncRange(p.floors);
    mount($('#m-alerts', el), html`
      ${p.exceedsNorm ? html`<div class="notice warn" role="status">${icon('alert')}<div><b>Posible exceso sobre la norma</b>
        <p>${p.floors} pisos superan los ${p.normFloors} que permite el índice de construcción. La volumetría se dibuja igual; confírmalo con la ficha normativa del predio.</p></div></div>` : ''}
      ${p.floors >= 15 ? html`<div class="notice info" role="status">${icon('info')}<div><b>Edificio en altura</b>
        <p>Prevé ascensores, escalera presurizada y núcleo estructural.</p></div></div>` : ''}`);
    mount($('#m-result', el), html`<div class="sep"></div>
      <div class="metric-grid">
        ${[['Huella', `${fmtNum(p.footprintArea)} m²`], ['Pisos', fmtNum(p.floors, 0)], ['Área total', `${fmtNum(p.totalArea)} m²`],
          ['Altura', `${fmtNum(p.floors * p.floorHeight + 0.4, 1)} m`], ['Pisos por norma', fmtNum(p.normFloors ?? p.floors, 0)], ['IC resultante', fmtNum(p.totalArea / p.lotArea, 2)]]
          .map(([k, v]) => html`<div class="metric"><div class="eyebrow">${k}</div><div class="display">${v}</div></div>`)}
      </div>
      ${p.notes.filter((n) => !/exceso|altura/i.test(n.title)).map((n) => html`<div class="rec ${n.priority}" style="padding:10px 0"><div class="mark" style="width:24px;height:24px">${icon('info')}</div><div><h4 style="font-size:13px">${n.title}</h4><p style="font-size:12px">${n.detail}</p></div><span></span></div>`)}`);
    const save = $('#save-glb', el);
    if (save) save.disabled = false;
  };
  const debounced = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => run().catch((e) => toast(e.message, 'error')), 260); }; })();

  const setFloors = (n) => {
    floorsInput.value = n ? String(Math.max(1, Math.floor(n))) : '';
    syncRange(Number(floorsInput.value) || 1);
    floorsCtl.refresh();
    debounced();
  };
  floorsInput.addEventListener('input', () => { syncRange(Number(floorsInput.value) || 1); debounced(); });
  range.addEventListener('input', () => setFloors(Number(range.value)));
  on(form, 'click', '[data-step]', (e, b) => setFloors((Number(floorsInput.value) || Number(range.value) || 1) + Number(b.dataset.step)));
  on(form, 'click', '[data-preset]', (e, b) => setFloors(Number(b.dataset.preset)));
  form.querySelectorAll('.form-grid input').forEach((i) => i.addEventListener('input', debounced));
  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  syncRange(Number(floorsInput.value) || 1);
  await run();

  $('#save-glb', el)?.addEventListener('click', (e) => busy(e.currentTarget, async () => {
    const { GLTFExporter } = await import('/vendor/three/addons/exporters/GLTFExporter.js');
    const exportable = group.clone();
    exportable.traverse((o) => { if (o.userData.helper) o.visible = false; });
    const buffer = await new GLTFExporter().parseAsync(exportable, { binary: true, onlyVisible: true });
    const file = new File([buffer], `volumetria-${(project.code || 'proyecto').toLowerCase()}.glb`, { type: 'model/gltf-binary' });
    const doc = await upload(`/projects/${projectId}/documents`, file, { kind: 'MODEL_3D', description: 'Volumetría generada con CIVIA (anteproyecto).' });
    toast('Volumetría guardada en el proyecto');
    location.hash = `#/viewer/${doc.id}`;
  }));
}
