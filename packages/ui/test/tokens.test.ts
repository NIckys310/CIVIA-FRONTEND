import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { buildCss } from '../scripts/build-css.ts';
import { contrastRatio } from '../src/contrast.ts';
import { icons } from '../src/icons.ts';
import { palette } from '../src/tokens.ts';

const AA_TEXT = 4.5;
const AA_UI = 3;

for (const [name, t] of Object.entries(palette)) {
  test(`${name}: texto principal y secundario cumplen AA sobre fondos`, () => {
    for (const bg of [t.bg, t.surface, t.surfaceAlt]) {
      assert.ok(contrastRatio(t.text, bg) >= AA_TEXT, `text sobre ${bg}`);
      assert.ok(contrastRatio(t.textMuted, bg) >= AA_TEXT, `textMuted sobre ${bg}`);
      assert.ok(contrastRatio(t.textSubtle, bg) >= AA_TEXT, `textSubtle sobre ${bg}`);
    }
  });

  test(`${name}: botones de marca y de acción son legibles`, () => {
    assert.ok(contrastRatio(t.onBrand, t.brand) >= AA_TEXT, 'onBrand/brand');
    assert.ok(contrastRatio(t.onAccent, t.accent) >= AA_TEXT, 'onAccent/accent');
  });

  test(`${name}: colores de estado legibles como texto sobre su fondo suave y sobre surface`, () => {
    for (const s of ['ok', 'warn', 'danger', 'info'] as const) {
      const soft = t[`${s}Soft`];
      assert.ok(contrastRatio(t[s], soft) >= AA_TEXT, `${s} sobre ${s}Soft`);
      assert.ok(contrastRatio(t[s], t.surface) >= AA_TEXT, `${s} sobre surface`);
    }
  });

  test(`${name}: el foco visible contrasta con el fondo (WCAG 2.4.13)`, () => {
    assert.ok(contrastRatio(t.focus, t.bg) >= AA_UI);
  });
}

test('tokens.css está sincronizado con tokens.ts', () => {
  const committed = readFileSync(new URL('../tokens.css', import.meta.url), 'utf8');
  assert.equal(committed, buildCss(), 'Ejecuta: npm run build -w @civia/ui');
});

test('todos los iconos tienen trazados válidos', () => {
  for (const [name, paths] of Object.entries(icons)) {
    assert.ok(paths.length > 0, name);
    for (const d of paths) assert.match(d, /^M/, `${name}: ${d}`);
  }
});
