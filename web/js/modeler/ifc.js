// Exporta el modelo a IFC4 (el estándar abierto de BIM). Cada elemento conserva su clase IFC y su geometría
// real como malla de triángulos, así que Revit, ArchiCAD o BIMcollab lo abren con la misma forma que en CIVIA.
import { FURNITURE_IFC } from './furniture.js';

const SLABS = ['slab', 'ribbed_slab', 'landing', 'balcony', 'cantilever'];
const ENTITY = {
  column: 'IFCCOLUMN', beam: 'IFCBEAM', grade_beam: 'IFCBEAM', pile: 'IFCPILE',
  wall: 'IFCWALL', partition: 'IFCWALL', parapet: 'IFCWALL', retaining_wall: 'IFCWALL', duct: 'IFCWALL',
  curtain_wall: 'IFCCURTAINWALL', chimney: 'IFCCHIMNEY', railing: 'IFCRAILING', ramp: 'IFCRAMP',
  stair: 'IFCSTAIR', l_stair: 'IFCSTAIR', u_stair: 'IFCSTAIR', spiral_stair: 'IFCSTAIR',
  roof: 'IFCROOF', shed_roof: 'IFCROOF', hip_roof: 'IFCROOF', flat_roof: 'IFCROOF', mansard: 'IFCROOF', sawtooth: 'IFCROOF', dome: 'IFCROOF', vault: 'IFCROOF', dormer: 'IFCROOF', canopy: 'IFCROOF',
  ceiling: 'IFCCOVERING', floor_finish: 'IFCCOVERING', cladding: 'IFCCOVERING',
  truss: 'IFCMEMBER', arch: 'IFCMEMBER', portal: 'IFCMEMBER', brace: 'IFCMEMBER', corbel: 'IFCMEMBER', lattice: 'IFCMEMBER', brise: 'IFCSHADINGDEVICE',
  door: 'IFCDOOR', double_door: 'IFCDOOR', sliding_door: 'IFCDOOR', garage_door: 'IFCDOOR',
  window: 'IFCWINDOW', sliding_window: 'IFCWINDOW', skylight: 'IFCWINDOW',
  footing: 'IFCFOOTING', strip_footing: 'IFCFOOTING', pile_cap: 'IFCFOOTING',
};
SLABS.forEach((t) => { ENTITY[t] = 'IFCSLAB'; });
Object.assign(ENTITY, FURNITURE_IFC); // IfcFurniture, IfcSanitaryTerminal, IfcLightFixture
ENTITY.raft = 'IFCSLAB';
const FOOTING_KIND = { footing: '.PAD_FOOTING.', strip_footing: '.STRIP_FOOTING.', pile_cap: '.PILE_CAP.' };

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
function guid() {
  const bytes = crypto.getRandomValues(new Uint8Array(22));
  // El primer carácter solo admite los valores 0 a 3 (el GUID comprimido de IFC codifica 128 bits).
  return [...bytes].map((b, i) => ALPHABET[i === 0 ? b % 4 : b % 64]).join('');
}

/** Texto en codificación STEP: comillas dobladas y acentos como \X2\HHHH\X0\. */
function text(value) {
  return `'${[...String(value)].map((ch) => {
    const code = ch.codePointAt(0);
    if (ch === "'") return "''";
    if (ch === '\\') return '\\\\';
    if (code >= 32 && code < 127) return ch;
    return code > 0xffff ? '' : `\\X2\\${code.toString(16).toUpperCase().padStart(4, '0')}\\X0\\`;
  }).join('')}'`;
}

const real = (v) => {
  const s = (Math.abs(v) < 5e-5 ? 0 : v).toFixed(4);
  return s;
};

/** Triángulos de un elemento en coordenadas de obra (IFC usa Z hacia arriba). */
function triangles(THREE, object) {
  const points = [];
  const faces = [];
  const v = new THREE.Vector3();
  object.updateWorldMatrix(true, true);
  object.traverse((mesh) => {
    const pos = mesh.isMesh ? mesh.geometry.attributes.position : null;
    if (!pos) return;
    const start = points.length;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      points.push([v.x, -v.z, v.y]);
    }
    const index = mesh.geometry.index;
    const count = index ? index.count : pos.count;
    for (let i = 0; i + 2 < count; i += 3) {
      const [a, b, c] = index ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)] : [i, i + 1, i + 2];
      faces.push([start + a + 1, start + b + 1, start + c + 1]); // IFC numera desde 1
    }
  });
  return { points, faces };
}

/**
 * @param THREE     módulo de Three.js
 * @param elements  elementos del modelo
 * @param objects   Map de id de elemento → objeto 3D
 * @param meta      { project, label(type) }
 */
export function exportIfc(THREE, elements, objects, { project = 'Proyecto', label = (t) => t } = {}) {
  const lines = [];
  const add = (entity) => { lines.push(entity); return `#${lines.length}`; };

  const origin = add('IFCCARTESIANPOINT((0.,0.,0.))');
  const axis3 = add(`IFCAXIS2PLACEMENT3D(${origin},$,$)`);
  const context = add(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${axis3},$)`);
  const body = add(`IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*,${context},$,.MODEL_VIEW.,$)`);
  const units = add(`IFCUNITASSIGNMENT((${[
    add('IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)'),
    add('IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)'),
    add('IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)'),
    add('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)'),
  ].join(',')}))`);
  const projectRef = add(`IFCPROJECT('${guid()}',$,${text(project)},$,$,$,$,(${context}),${units})`);
  const sitePlace = add(`IFCLOCALPLACEMENT($,${axis3})`);
  const site = add(`IFCSITE('${guid()}',$,${text('Sitio')},$,$,${sitePlace},$,$,.ELEMENT.,$,$,$,$,$)`);
  const buildingPlace = add(`IFCLOCALPLACEMENT(${sitePlace},${axis3})`);
  const building = add(`IFCBUILDING('${guid()}',$,${text(project)},$,$,${buildingPlace},$,$,.ELEMENT.,$,$,$)`);
  const storeyPlace = add(`IFCLOCALPLACEMENT(${buildingPlace},${axis3})`);
  const storey = add(`IFCBUILDINGSTOREY('${guid()}',$,${text('Nivel 0')},$,$,${storeyPlace},$,$,.ELEMENT.,0.)`);
  add(`IFCRELAGGREGATES('${guid()}',$,$,$,${projectRef},(${site}))`);
  add(`IFCRELAGGREGATES('${guid()}',$,$,$,${site},(${building}))`);
  add(`IFCRELAGGREGATES('${guid()}',$,$,$,${building},(${storey}))`);

  const products = [];
  for (const el of elements) {
    const object = objects.get(el.id);
    if (!object) continue;
    const { points, faces } = triangles(THREE, object);
    if (!faces.length) continue;
    const list = add(`IFCCARTESIANPOINTLIST3D((${points.map((p) => `(${p.map(real).join(',')})`).join(',')}),$)`);
    const mesh = add(`IFCTRIANGULATEDFACESET(${list},$,.F.,(${faces.map((f) => `(${f.join(',')})`).join(',')}),$)`);
    const shape = add(`IFCSHAPEREPRESENTATION(${body},'Body','Tessellation',(${mesh}))`);
    const definition = add(`IFCPRODUCTDEFINITIONSHAPE($,$,(${shape}))`);
    const place = add(`IFCLOCALPLACEMENT(${storeyPlace},${axis3})`);
    const entity = ENTITY[el.type] || 'IFCBUILDINGELEMENTPROXY';
    const head = `'${guid()}',$,${text(label(el.type))},$,$,${place},${definition},$`;
    let tail = ',$'; // tipo predefinido sin especificar
    if (entity === 'IFCFOOTING') tail = `,${FOOTING_KIND[el.type]}`;
    else if (el.type === 'raft') tail = ',.BASESLAB.';
    else if (entity === 'IFCPILE') tail = ',$,$';
    else if (entity === 'IFCDOOR' || entity === 'IFCWINDOW') {
      const w = Number(el.params?.width) || 0;
      const h = Number(el.params?.height ?? el.params?.length) || 0;
      tail = `,${real(h)},${real(w)},$,$,$`;
    }
    products.push(add(`${entity}(${head}${tail})`));
  }
  if (products.length) add(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid()}',$,$,$,(${products.join(',')}),${storey})`);

  const stamp = new Date().toISOString().slice(0, 19);
  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [ReferenceView]'),'2;1');
FILE_NAME(${text(`${project}.ifc`)},'${stamp}',(''),('CIVIA AI'),'CIVIA','CIVIA AI','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
${lines.map((l, i) => `#${i + 1}=${l};`).join('\n')}
ENDSEC;
END-ISO-10303-21;
`;
}
