/**
 * Genera tokens.css a partir de src/tokens.ts (fuente única de verdad).
 * Uso: node scripts/build-css.ts   (Node ≥ 22.18 ejecuta TypeScript de forma nativa)
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { font, motion, palette, radius } from '../src/tokens.ts';

const kebab = (s: string): string => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

function vars(theme: Record<string, string>, indent: string): string {
  return Object.entries(theme)
    .map(([k, v]) => `${indent}--c-${kebab(k)}: ${v};`)
    .join('\n');
}

export function buildCss(): string {
  const shared = [
    ...Object.entries(radius).map(([k, v]) => `  --r-${k}: ${v}px;`),
    `  --f-sans: ${font.sans};`,
    `  --f-mono: ${font.mono};`,
    `  --motion-fast: ${motion.fast}ms;`,
    `  --motion-base: ${motion.base}ms;`,
    `  --motion-slow: ${motion.slow}ms;`,
    `  --ease: ${motion.easing};`,
  ].join('\n');

  return `/* Generado por packages/ui/scripts/build-css.ts — NO editar a mano. */
:root {
${shared}
${vars(palette.light, '  ')}
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${vars(palette.dark, '    ')}
    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
${vars(palette.dark, '  ')}
  color-scheme: dark;
}
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('../tokens.css', import.meta.url), buildCss());
  console.log('tokens.css generado');
}
