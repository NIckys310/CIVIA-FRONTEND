/**
 * Sincroniza el contrato OpenAPI publicado por CIVIA-BACKEND y regenera los tipos TS.
 *
 * Uso:
 *   npm run contract:sync                       # ../CIVIA-BACKEND/services/api/openapi.json
 *   npm run contract:sync -- <ruta-o-url>       # otra ruta, o la API en marcha:
 *   npm run contract:sync -- http://localhost:8000/api/v1/openapi.json
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = process.argv[2] ?? `${root}../CIVIA-BACKEND/services/api/openapi.json`;
const target = `${root}packages/shared-types/openapi.json`;

let text;
if (/^https?:\/\//.test(source)) {
  const res = await fetch(source);
  if (!res.ok) throw new Error(`No se pudo descargar el contrato (${res.status}) desde ${source}`);
  text = await res.text();
} else {
  text = readFileSync(source, 'utf8');
}

const spec = JSON.parse(text); // valida que sea JSON antes de sobrescribir
if (!spec.openapi || !spec.paths) throw new Error('El archivo no parece un contrato OpenAPI');

writeFileSync(target, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Contrato copiado desde ${source}`);
execSync('npm run generate -w @civia/shared-types', { cwd: root, stdio: 'inherit' });
