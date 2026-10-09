/**
 * Auditoría de dependencias de producción con excepciones revisadas.
 *
 * Falla si hay vulnerabilidades HIGH/CRITICAL que no estén en `audit-allowlist.json`,
 * o si una excepción ya venció (obliga a revisarla de nuevo). Cada excepción debe explicar
 * por qué el código vulnerable no llega a lo que se publica (app, web o servidor).
 *
 * Uso: npm run audit:prod
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const BLOCKING = new Set(['high', 'critical']);
const allowlist = JSON.parse(readFileSync(new URL('../audit-allowlist.json', import.meta.url), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

let raw;
try {
  raw = execSync('npm audit --omit=dev --json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (err) {
  raw = err.stdout; // npm audit sale con código 1 cuando encuentra vulnerabilidades
}
const report = JSON.parse(raw);

const advisories = new Map();
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via === 'string') continue; // transitiva: se reporta en el paquete raíz
    const id = via.url.split('/').pop();
    advisories.set(id, { id, pkg: via.name, severity: via.severity, title: via.title, url: via.url });
  }
}

const problems = [];
for (const adv of advisories.values()) {
  const entry = allowlist[adv.id];
  if (!BLOCKING.has(adv.severity)) {
    console.log(`·  ${adv.severity.padEnd(8)} ${adv.pkg}: ${adv.title} (no bloquea)`);
  } else if (!entry) {
    problems.push(`✖  ${adv.severity} ${adv.pkg}: ${adv.title}\n   ${adv.url}`);
  } else if (entry.expires < today) {
    problems.push(`✖  Excepción vencida (${entry.expires}) para ${adv.id} ${adv.pkg}: revísala`);
  } else {
    console.log(`✓  ${adv.severity.padEnd(8)} ${adv.pkg}: aceptado hasta ${entry.expires} — ${entry.reason}`);
  }
}

for (const id of Object.keys(allowlist)) {
  if (!advisories.has(id)) console.log(`ℹ  ${id} ya no aparece: puedes quitarlo de audit-allowlist.json`);
}

if (problems.length) {
  console.error(`\n${problems.join('\n')}\n`);
  process.exit(1);
}
console.log('\nAuditoría de producción OK');
