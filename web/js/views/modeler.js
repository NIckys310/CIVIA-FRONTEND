// Modelador 3D de CIVIA: elementos paramétricos (columnas, vigas, losas, zapatas, muros, puertas,
// ventanas, escaleras, cubiertas) con materiales PBR, sombras suaves, oclusión ambiental, vistas,
// cómputo de cantidades, exportación a GLB y capturas de alta resolución.
import { api, upload } from '../api.js';
import { $, confirmDialog, fmtNum, html, icon, mount, on, toast } from '../ui.js';
import { MATERIALS, TYPES, buildElement, createElement, createMaterials, quantities, sampleModel, wallOpenings } from '../modeler/elements.js';

const V = '/vendor/three';

export async function render(el, { projectId }) {
  if (!projectId) return pickProject(el);
  const project = await api.get(`/projects/${projectId}`);
  const canEdit = project.role !== 'VIEWER';

  mount(el, html`
  <div class="page-head" style="margin-bottom:14px">
    <div><div class="eyebrow gold">Modelado 3D · ${project.name}</div><h1 style="font-size:28px">Modelo <span class="chrome-text">estructural y arquitectónico</span></h1></div>
    <div class="row wrap">
      <span class="hint" id="m-status">Cargando…</span>
      <button class="btn" id="m-shot">${icon('camera')} Render</button>
      <button class="btn" id="m-glb">${icon('download')} GLB</button>
      ${canEdit ? html`<button class="btn primary" id="m-save" data-busy="Guardando…">${icon('save')} Guardar</button>` : ''}
    </div>
  </div>
  <div class="modeler">
    <aside class="card m-lib" aria-label="Elementos">
      <div class="eyebrow gold" style="padding:14px 14px 6px">Elementos</div>
      ${Object.entries(groupBy(TYPES)).map(([cat, types]) => html`<div class="m-cat">${cat}</div>
        <div class="m-grid">${types.map(([k, t]) => html`<button class="m-tool" data-add="${k}" ${canEdit ? '' : 'disabled'} title="Agregar ${t.label.toLowerCase()}">${icon(t.icon)}<span>${t.label}</span></button>`)}</div>`)}
      <div class="m-cat">Trabajo</div>
      <div class="m-row"><label class="hint" for="m-level">Nivel</label><input class="input sm" id="m-level" type="number" step="0.1" value="0"><span class="hint">m</span></div>
      <div class="m-row"><label class="hint" for="m-snap">Rejilla</label>
        <select class="input sm" id="m-snap"><option value="0.05">5 cm</option><option value="0.1">10 cm</option><option value="0.25" selected>25 cm</option><option value="0.5">50 cm</option><option value="1">1 m</option></select></div>
      ${canEdit ? html`<button class="btn sm block" id="m-sample" style="margin:10px 14px 0;width:calc(100% - 28px)">${icon('sparkle')} Estructura de ejemplo</button>` : ''}
    </aside>
    <div class="m-stage" id="m-stage">
      <div class="m-toolbar glass-panel">
        <button class="btn ghost icon sm" data-view="persp" title="Perspectiva">${icon('cube')}</button>
        <button class="btn ghost icon sm" data-view="top" title="Planta">${icon('grid')}</button>
        <button class="btn ghost icon sm" data-view="front" title="Alzado frontal">${icon('building')}</button>
        <button class="btn ghost icon sm" data-view="side" title="Alzado lateral">${icon('columns')}</button>
        <span class="m-sep"></span>
        <button class="btn ghost icon sm" id="m-mode-move" title="Mover (G)">${icon('move')}</button>
        <button class="btn ghost icon sm" id="m-mode-rot" title="Rotar (R)">${icon('rotate')}</button>
        <span class="m-sep"></span>
        <button class="btn ghost icon sm" id="m-undo" title="Deshacer (Ctrl+Z)">${icon('undo')}</button>
        <button class="btn ghost icon sm" id="m-redo" title="Rehacer (Ctrl+Y)">${icon('redo')}</button>
        <span class="m-sep"></span>
        <label class="m-switch" title="Oclusión ambiental y sombras de alta calidad"><input type="checkbox" id="m-quality" checked> Render</label>
        <label class="m-switch"><input type="checkbox" id="m-grid" checked> Rejilla</label>
      </div>
      <div class="m-hint glass-panel" id="m-hint" hidden></div>
      <div class="loading" id="m-loading"><div class="spinner" style="width:28px;height:28px"></div></div>
    </div>
    <aside class="card m-props" id="m-props"></aside>
  </div>`);

  const [THREE, { OrbitControls }, { TransformControls }, { RoomEnvironment }, { EffectComposer }, { RenderPass }, { GTAOPass }, { OutlinePass }, { OutputPass }] = await Promise.all([
    import(`${V}/three.module.min.js`), import(`${V}/addons/controls/OrbitControls.js`), import(`${V}/addons/controls/TransformControls.js`),
    import(`${V}/addons/environments/RoomEnvironment.js`), import(`${V}/addons/postprocessing/EffectComposer.js`),
    import(`${V}/addons/postprocessing/RenderPass.js`), import(`${V}/addons/postprocessing/GTAOPass.js`),
    import(`${V}/addons/postprocessing/OutlinePass.js`), import(`${V}/addons/postprocessing/OutputPass.js`),
  ]);

  // ------------------------------------------------------------------ escena
  const stage = $('#m-stage', el);
  if (!stage) return undefined; // la vista se reemplazó mientras cargaba Three.js
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Entorno suave: da reflejos realistas sin lavar los colores de los materiales.
  scene.environmentIntensity = 0.4;
  scene.background = skyTexture(THREE);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 1500);
  camera.position.set(18, 13, 20);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.target.set(5, 1.5, 2);
  orbit.maxPolarAngle = Math.PI * 0.497;

  scene.add(new THREE.HemisphereLight(0xdfe7f2, 0x2f2a24, 0.35));
  const sun = new THREE.DirectionalLight(0xffeedd, 2.2);
  sun.position.set(25, 35, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 140 });
  scene.add(sun, sun.target);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x5f6459, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.001;
  ground.receiveShadow = true;
  ground.name = '__ground';
  scene.add(ground);
  const grid = new THREE.GridHelper(200, 200, 0x3c434d, 0x535a52);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  const root = new THREE.Group();
  scene.add(root);
  const mats = createMaterials(THREE);

  const gizmo = new TransformControls(camera, renderer.domElement);
  gizmo.setTranslationSnap(0.25);
  gizmo.setRotationSnap(THREE.MathUtils.degToRad(15));
  gizmo.showY = true;
  scene.add(gizmo.getHelper ? gizmo.getHelper() : gizmo);
  gizmo.addEventListener('dragging-changed', (e) => { orbit.enabled = !e.value; if (!e.value) commitTransform(); });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, 1, 1);
  ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.1 });
  ao.blendIntensity = 0.9;
  composer.addPass(ao);
  const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera);
  outline.visibleEdgeColor.set(0xf2cf9f);
  outline.hiddenEdgeColor.set(0x7a5a33);
  outline.edgeStrength = 4;
  outline.edgeThickness = 1.2;
  composer.addPass(outline);
  composer.addPass(new OutputPass());

  const resize = () => {
    const w = stage.clientWidth; const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  let raf = 0;
  let quality = true;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    orbit.update();
    if (quality) composer.render(); else renderer.render(scene, camera);
  };
  loop();

  // ------------------------------------------------------------------ estado del modelo
  let model = { version: 1, elements: [] };
  let revision = 0;
  let selected = null;
  let dirty = false;
  const undo = [];
  const redo = [];
  const objects = new Map();

  const setStatus = (text) => { $('#m-status', el).textContent = text; };
  const snapStep = () => Number($('#m-snap', el).value);
  const level = () => Number($('#m-level', el).value) || 0;
  const snap = (v) => Math.round(v / snapStep()) * snapStep();

  function rebuild() {
    for (const o of objects.values()) disposeObject(root, o);
    objects.clear();
    for (const e of model.elements) {
      const o = buildElement(THREE, e, mats, wallOpenings(e, model.elements));
      root.add(o);
      objects.set(e.id, o);
    }
    if (selected && !objects.has(selected)) select(null);
    else if (selected) select(selected);
    drawQuantities();
  }

  function refreshElement(id) {
    // Mover o cambiar una puerta o ventana cambia los vanos de los muros: se reconstruye todo.
    const changed = model.elements.find((x) => x.id === id);
    if (!changed || changed.type === 'door' || changed.type === 'window' || changed.type === 'wall') {
      rebuild();
      if (selected) select(selected);
      return;
    }
    const e = changed;
    const old = objects.get(id);
    if (old) disposeObject(root, old);
    if (!e) { objects.delete(id); return; }
    const o = buildElement(THREE, e, mats, wallOpenings(e, model.elements));
    root.add(o);
    objects.set(id, o);
    if (selected === id) { gizmo.attach(o); outline.selectedObjects = [o]; }
    drawQuantities();
  }

  function change(mutator, keepRedo = false) {
    undo.push(JSON.stringify(model));
    if (undo.length > 100) undo.shift();
    if (!keepRedo) redo.length = 0;
    mutator();
    dirty = true;
    setStatus('Cambios sin guardar');
  }

  function select(id) {
    selected = id;
    const o = id ? objects.get(id) : null;
    if (o && canEdit) gizmo.attach(o); else gizmo.detach();
    outline.selectedObjects = o ? [o] : [];
    drawProps();
  }

  function commitTransform() {
    const o = selected && objects.get(selected);
    if (!o) return;
    const before = JSON.stringify(model);
    const e = model.elements.find((x) => x.id === selected);
    const pos = [snap(o.position.x), Math.round(o.position.y * 1000) / 1000, snap(o.position.z)];
    const rot = Math.round(THREE.MathUtils.radToDeg(o.rotation.y) * 10) / 10;
    if (JSON.stringify([pos, rot]) === JSON.stringify([e.position, e.rotation])) return;
    undo.push(before);
    redo.length = 0;
    e.position = pos;
    e.rotation = rot;
    o.position.set(...pos);
    if (['door', 'window', 'wall'].includes(e.type)) { rebuild(); select(e.id); } // vanos de los muros
    dirty = true;
    setStatus('Cambios sin guardar');
    drawProps();
  }

  // ------------------------------------------------------------------ panel de propiedades
  function drawProps() {
    const box = $('#m-props', el);
    const e = selected && model.elements.find((x) => x.id === selected);
    if (!e) {
      mount(box, html`<div class="eyebrow gold" style="padding:14px 14px 6px">Cantidades del modelo</div><div id="m-qty" class="m-qty"></div>
        <p class="hint" style="padding:0 14px 14px">Selecciona un elemento para editar sus medidas, material y posición. ${canEdit ? 'Arrastra con el gizmo para moverlo.' : ''}</p>`);
      drawQuantities();
      return;
    }
    const t = TYPES[e.type];
    mount(box, html`<div class="m-props-head"><div>${icon(t.icon)}</div><div><div class="eyebrow gold">${t.category}</div><h3>${t.label}</h3></div></div>
      <div class="m-form">
        <label class="field"><span>Material</span><select class="input sm" data-mat ${canEdit ? '' : 'disabled'}>${t.materials.map((m) => html`<option value="${m}" ${m === e.material ? 'selected' : ''}>${MATERIALS[m].label}</option>`)}</select></label>
        ${Object.entries(t.params).map(([k, p]) => (p.options
          ? html`<label class="field"><span>${p.label}</span><select class="input sm" data-param="${k}" ${canEdit ? '' : 'disabled'}>${Object.entries(p.options).map(([v, l]) => html`<option value="${v}" ${e.params[k] === v ? 'selected' : ''}>${l}</option>`)}</select></label>`
          : html`<label class="field"><span>${p.label}${p.unit ? ` (${p.unit})` : ''}</span><input class="input sm" type="number" data-param="${k}" value="${e.params[k]}" min="${p.min}" max="${p.max}" step="${p.step}" ${canEdit ? '' : 'disabled'}></label>`))}
        <div class="m-xyz">${['X', 'Y', 'Z'].map((a, i) => html`<label class="field"><span>${a} (m)</span><input class="input sm" type="number" step="0.05" data-pos="${i}" value="${e.position[i]}" ${canEdit ? '' : 'disabled'}></label>`)}</div>
        <label class="field"><span>Rotación (°)</span><input class="input sm" type="number" step="15" data-rot value="${e.rotation || 0}" ${canEdit ? '' : 'disabled'}></label>
      </div>
      ${canEdit ? html`<div class="row" style="padding:0 14px 14px;gap:6px"><button class="btn sm" id="m-dup">${icon('copy')} Duplicar</button><button class="btn sm danger right" id="m-del">${icon('trash')} Borrar</button></div>` : ''}`);
  }

  on($('#m-props', el), 'change', '[data-param], [data-mat], [data-pos], [data-rot]', (ev, input) => {
    const e = model.elements.find((x) => x.id === selected);
    if (!e) return;
    change(() => {
      if (input.dataset.mat !== undefined) e.material = input.value;
      else if (input.dataset.param) {
        const spec = TYPES[e.type].params[input.dataset.param];
        e.params[input.dataset.param] = spec.options ? input.value : clamp(Number(input.value), spec.min, spec.max);
        if (!spec.options) input.value = e.params[input.dataset.param];
      } else if (input.dataset.pos !== undefined) e.position[Number(input.dataset.pos)] = Number(input.value) || 0;
      else e.rotation = Number(input.value) || 0;
    });
    refreshElement(e.id);
  });
  on($('#m-props', el), 'click', '#m-dup', () => duplicate());
  on($('#m-props', el), 'click', '#m-del', () => remove());

  function duplicate() {
    const e = model.elements.find((x) => x.id === selected);
    if (!e) return;
    const copy = JSON.parse(JSON.stringify(e));
    copy.id = createElement(e.type).id;
    copy.position = [e.position[0] + snapStep() * 4, e.position[1], e.position[2] + snapStep() * 4];
    change(() => model.elements.push(copy));
    refreshElement(copy.id);
    select(copy.id);
  }

  function remove() {
    if (!selected) return;
    const id = selected;
    change(() => { model.elements = model.elements.filter((x) => x.id !== id); });
    select(null);
    refreshElement(id);
  }

  function drawQuantities() {
    const box = $('#m-qty', el);
    if (!box) return;
    const q = quantities(model.elements);
    const row = (label, value, unit) => html`<div class="m-qty-row"><span>${label}</span><b>${value}</b><small>${unit}</small></div>`;
    mount(box, html`${row('Elementos', model.elements.length, '')}${row('Concreto', fmtNum(q.concrete, 2), 'm³')}
      ${row('Acero', fmtNum(q.steel, 0), 'kg')}${row('Mampostería', fmtNum(q.masonry, 1), 'm²')}${row('Cubierta', fmtNum(q.roof, 1), 'm²')}
      ${row('Vidrio', fmtNum(q.glass, 1), 'm²')}${row('Puertas · ventanas', `${q.doors} · ${q.windows}`, '')}`);
  }

  // ------------------------------------------------------------------ colocar elementos
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let placing = null; // { type, ghost, rotation }

  function pointerToGround(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -level());
    const hit = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
  }

  function startPlacing(type) {
    cancelPlacing();
    const e = createElement(type, [0, level(), 0]);
    const ghost = buildElement(THREE, e, mats);
    ghost.traverse((o) => {
      if (!o.isMesh) return;
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.opacity = 0.55;
      o.castShadow = false;
    });
    scene.add(ghost);
    placing = { type, ghost, element: e };
    showHint(`Haz clic para colocar ${TYPES[type].label.toLowerCase()} · R gira 90° · Esc cancela`);
  }

  function cancelPlacing() {
    if (!placing) return;
    disposeObject(scene, placing.ghost);
    placing = null;
    showHint('');
  }

  function showHint(text) {
    const h = $('#m-hint', el);
    h.hidden = !text;
    h.textContent = text;
  }

  renderer.domElement.addEventListener('pointermove', (ev) => {
    if (!placing) return;
    const p = pointerToGround(ev);
    if (!p) return;
    placing.ghost.position.set(snap(p.x), level(), snap(p.z));
  });

  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY]; });
  renderer.domElement.addEventListener('pointerup', (ev) => {
    // Un arrastre (orbitar) no cuenta como clic.
    if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 5 || gizmo.dragging) return;
    if (placing) {
      const e = placing.element;
      e.position = [placing.ghost.position.x, level(), placing.ghost.position.z];
      e.rotation = Math.round(THREE.MathUtils.radToDeg(placing.ghost.rotation.y));
      change(() => model.elements.push(e));
      refreshElement(e.id);
      const type = placing.type;
      cancelPlacing();
      select(e.id);
      if (ev.shiftKey) startPlacing(type); // Mayús: seguir colocando del mismo tipo
      return;
    }
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(root.children, true)[0];
    select(hit?.object.userData.elementId || null);
  });

  on(el, 'click', '[data-add]', (ev, b) => startPlacing(b.dataset.add));

  const onKey = (ev) => {
    if (/input|select|textarea/i.test(document.activeElement?.tagName || '')) return;
    const k = ev.key.toLowerCase();
    if (k === 'escape') { cancelPlacing(); select(null); }
    else if (k === 'r' && placing) placing.ghost.rotation.y += Math.PI / 2;
    else if (k === 'r') gizmo.setMode('rotate');
    else if (k === 'g') gizmo.setMode('translate');
    else if ((k === 'delete' || k === 'backspace') && selected && canEdit) { ev.preventDefault(); remove(); }
    else if (k === 'd' && (ev.ctrlKey || ev.metaKey) && canEdit) { ev.preventDefault(); duplicate(); }
    else if (k === 'z' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); (ev.shiftKey ? doRedo : doUndo)(); }
    else if (k === 'y' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); doRedo(); }
    else if (k === 's' && (ev.ctrlKey || ev.metaKey) && canEdit) { ev.preventDefault(); save(); }
  };
  document.addEventListener('keydown', onKey);

  function doUndo() {
    if (!undo.length) return;
    redo.push(JSON.stringify(model));
    model = JSON.parse(undo.pop());
    dirty = true;
    rebuild();
    drawProps();
  }
  function doRedo() {
    if (!redo.length) return;
    undo.push(JSON.stringify(model));
    model = JSON.parse(redo.pop());
    dirty = true;
    rebuild();
    drawProps();
  }
  $('#m-undo', el).onclick = doUndo;
  $('#m-redo', el).onclick = doRedo;
  $('#m-mode-move', el).onclick = () => gizmo.setMode('translate');
  $('#m-mode-rot', el).onclick = () => gizmo.setMode('rotate');
  $('#m-snap', el).onchange = () => gizmo.setTranslationSnap(snapStep());
  $('#m-grid', el).onchange = (e) => { grid.visible = e.target.checked; };
  $('#m-quality', el).onchange = (e) => { quality = e.target.checked; renderer.shadowMap.type = quality ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap; };

  // ------------------------------------------------------------------ vistas
  function bounds() {
    const b = new THREE.Box3().setFromObject(root);
    if (b.isEmpty()) b.set(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 3, 5));
    return b;
  }
  function view(kind) {
    const b = bounds();
    const c = b.getCenter(new THREE.Vector3());
    const s = b.getSize(new THREE.Vector3());
    const r = Math.max(s.x, s.y, s.z, 4);
    const pos = { persp: [c.x + r * 1.2, c.y + r * 0.85, c.z + r * 1.3], top: [c.x, c.y + r * 2.6, c.z + 0.001], front: [c.x, c.y + s.y * 0.2, c.z + r * 2.2], side: [c.x + r * 2.2, c.y + s.y * 0.2, c.z] }[kind];
    camera.position.set(...pos);
    orbit.target.copy(c);
    orbit.update();
  }
  on(el, 'click', '[data-view]', (ev, b) => view(b.dataset.view));

  // ------------------------------------------------------------------ guardar, exportar, render
  async function save() {
    const btn = $('#m-save', el);
    if (!btn) return;
    btn.disabled = true;
    setStatus('Guardando…');
    try {
      const r = await api.put(`/projects/${projectId}/model`, { model, revision });
      revision = r.revision;
      dirty = false;
      setStatus(`Guardado · revisión ${revision}`);
      toast('Modelo guardado');
    } catch (e) {
      setStatus('No se pudo guardar');
      toast(e.message, 'error');
    } finally { btn.disabled = false; }
  }
  $('#m-save', el)?.addEventListener('click', save);

  $('#m-sample', el)?.addEventListener('click', async () => {
    if (model.elements.length && !(await confirmDialog('Estructura de ejemplo', 'Se agregará un pórtico de ejemplo al modelo actual.', 'Agregar'))) return;
    const sample = sampleModel();
    change(() => { model.elements = model.elements.concat(sample.elements); });
    rebuild();
    view('persp');
  });

  $('#m-shot', el).onclick = () => {
    // Render en alta resolución (2×) con oclusión ambiental, sin rejilla ni gizmo.
    const helper = gizmo.getHelper ? gizmo.getHelper() : gizmo;
    const prev = { grid: grid.visible, helper: helper.visible, sel: outline.selectedObjects, ratio: renderer.getPixelRatio() };
    grid.visible = false; helper.visible = false; outline.selectedObjects = [];
    renderer.setPixelRatio(2);
    resize();
    composer.render();
    renderer.domElement.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `render-${slug(project.name)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
    grid.visible = prev.grid; helper.visible = prev.helper; outline.selectedObjects = prev.sel;
    renderer.setPixelRatio(prev.ratio);
    resize();
  };

  $('#m-glb', el).onclick = async () => {
    const { GLTFExporter } = await import(`${V}/addons/exporters/GLTFExporter.js`);
    new GLTFExporter().parse(root, async (glb) => {
      const file = new File([glb], `modelo-${slug(project.name)}.glb`, { type: 'model/gltf-binary' });
      if (canEdit && await confirmDialog('Exportar GLB', '¿Guardar también el GLB en los archivos del proyecto (pestaña Archivos) además de descargarlo?', 'Guardar en el proyecto')) {
        try { await upload(`/projects/${projectId}/documents`, file, { kind: 'MODEL_3D', description: 'Modelo exportado desde el modelador de CIVIA.' }); toast('GLB guardado en el proyecto'); } catch (e) { toast(e.message, 'error'); }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, (err) => toast(err.message || 'No se pudo exportar', 'error'), { binary: true });
  };

  const beforeUnload = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
  window.addEventListener('beforeunload', beforeUnload);

  // ------------------------------------------------------------------ carga inicial
  try {
    const saved = await api.get(`/projects/${projectId}/model`);
    model = saved.model?.elements ? saved.model : { version: 1, elements: [] };
    revision = saved.revision || 0;
    setStatus(revision ? `Revisión ${revision}${saved.updatedBy ? ` · ${saved.updatedBy}` : ''}` : 'Modelo nuevo');
  } catch (e) {
    setStatus('No se pudo cargar el modelo');
    toast(e.message, 'error');
  }
  const draftKey = `civia-model-draft-${projectId}`;
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
    localStorage.removeItem(draftKey);
    if (draft?.model?.elements && canEdit && await confirmDialog('Recuperar borrador',
      `Saliste del modelador con cambios sin guardar (${draft.model.elements.length} elementos). ¿Recuperarlos?`, 'Recuperar')) {
      model = draft.model;
      dirty = true;
      setStatus('Borrador recuperado · sin guardar');
    }
  } catch { /* borrador dañado: se ignora */ }
  rebuild();
  drawProps();
  view('persp');
  $('#m-loading', el)?.remove();

  return () => {
    // Salir con cambios sin guardar deja un borrador en este navegador; al volver se ofrece recuperarlo.
    if (dirty) {
      try { localStorage.setItem(draftKey, JSON.stringify({ model, revision })); } catch { /* sin espacio */ }
      toast('Guardamos un borrador del modelo: lo recuperas al volver al modelador.', 'info');
    }
    cancelAnimationFrame(raf);
    ro.disconnect();
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('beforeunload', beforeUnload);
    gizmo.dispose();
    orbit.dispose();
    root.traverse((o) => o.geometry?.dispose());
    mats.dispose();
    composer.dispose?.();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

// ------------------------------------------------------------------ utilidades

async function pickProject(el) {
  const projects = await api.get('/projects');
  mount(el, html`<div class="page-head"><div><div class="eyebrow gold">Modelado 3D</div><h1>Elige un <span class="chrome-text">proyecto</span></h1>
    <p class="muted">Modela la estructura y la arquitectura con elementos paramétricos: columnas, vigas, losas, muros, puertas, ventanas, escaleras y cubiertas.</p></div></div>
    ${projects.length ? html`<div class="grid g3">${projects.map((p) => html`<a class="card hover pad" href="#/modeler/${p.id}">
      <div class="eyebrow">${p.code || 'Proyecto'}</div><h3 style="margin-top:8px">${p.name}</h3><p class="hint" style="margin-top:6px">${p.location || ''}</p>
      <span class="btn sm" style="margin-top:14px">${icon('cube')} Abrir modelador</span></a>`)}</div>`
      : html`<div class="card"><div class="empty">${icon('cube', 'big')}<p>Crea un proyecto para empezar a modelar.</p><a class="btn primary" href="#/projects?new">${icon('plus')} Nuevo proyecto</a></div></div>`}`);
}

function groupBy(types) {
  const out = {};
  for (const [k, t] of Object.entries(types)) (out[t.category] ||= []).push([k, t]);
  return out;
}

function skyTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const g = c.getContext('2d').createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6f8fb6');
  g.addColorStop(0.55, '#c9d6e3');
  g.addColorStop(1, '#e8e2d6');
  const ctx = c.getContext('2d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function disposeObject(parent, o) {
  parent.remove(o);
  o.traverse((x) => x.geometry?.dispose());
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
const slug = (s) => String(s || 'modelo').normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
