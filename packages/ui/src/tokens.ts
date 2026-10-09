/**
 * Design tokens de CIVIA — "el cuaderno de obra del siglo XXI".
 * Fuente única de verdad para web (CSS variables en tokens.css) y móvil (React Native).
 *
 * Reglas:
 * - `brand` (azul plano/blueprint) identifica la marca y la navegación.
 * - `accent` (naranja seguridad de obra) solo para la acción principal de cada pantalla.
 *   Texto sobre naranja SIEMPRE oscuro (`onAccent`), como la señalización de obra.
 * - Colores de estado SOLO comunican información, nunca decoran, y siempre van con icono + texto.
 */

import type { IconName } from './icons';

export const palette = {
  light: {
    bg: '#F5F4F0', // blanco hueso
    surface: '#FFFFFF',
    surfaceAlt: '#EDECE7', // gris hormigón claro
    surfaceSunken: '#E6E4DE',
    border: '#D9D6CE',
    borderStrong: '#BDB9AE',
    text: '#16191D',
    textMuted: '#585E66',
    textSubtle: '#62676E',
    brand: '#1D5FB4',
    brandStrong: '#174C90',
    brandSoft: '#E3EDFA',
    onBrand: '#FFFFFF',
    accent: '#F26A1B',
    accentStrong: '#D9570C',
    onAccent: '#16191D',
    grid: 'rgba(29, 95, 180, 0.07)',
    gridStrong: 'rgba(29, 95, 180, 0.14)',
    ok: '#1B7442',
    okSoft: '#E2F3E8',
    warn: '#8C5A00',
    warnSoft: '#FBF0D9',
    danger: '#BE3328',
    dangerSoft: '#FBE5E2',
    info: '#1D5FB4',
    infoSoft: '#E3EDFA',
    focus: '#1D5FB4',
  },
  dark: {
    bg: '#0A111D', // azul pizarra casi negro
    surface: '#0F1828',
    surfaceAlt: '#152136',
    surfaceSunken: '#0C1422',
    border: '#22314A',
    borderStrong: '#33465F',
    text: '#E7ECF3',
    textMuted: '#9AA7BA',
    textSubtle: '#7E8BA0',
    brand: '#6AA8F2',
    brandStrong: '#8DBDF6',
    brandSoft: '#14294A',
    onBrand: '#07101D',
    accent: '#FF7A2E',
    accentStrong: '#FF9152',
    onAccent: '#140A03',
    grid: 'rgba(106, 168, 242, 0.06)',
    gridStrong: 'rgba(106, 168, 242, 0.13)',
    ok: '#4CC27E',
    okSoft: '#0F2A1D',
    warn: '#E9B04A',
    warnSoft: '#2D2310',
    danger: '#F2756A',
    dangerSoft: '#341614',
    info: '#6AA8F2',
    infoSoft: '#14294A',
    focus: '#8DBDF6',
  },
} as const;

export type ThemeName = keyof typeof palette;
export type ColorToken = keyof (typeof palette)['light'];

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const;

export const font = {
  sans: 'Geist, "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: '"Geist Mono", "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
} as const;

/** Escala tipográfica (px). `label` es el rotulado técnico en mayúsculas espaciadas. */
export const type = {
  display: { size: 34, line: 40, weight: '600', tracking: -0.6 },
  h1: { size: 26, line: 32, weight: '600', tracking: -0.4 },
  h2: { size: 20, line: 28, weight: '600', tracking: -0.2 },
  h3: { size: 16, line: 22, weight: '600', tracking: -0.1 },
  body: { size: 15, line: 22, weight: '400', tracking: 0 },
  small: { size: 13, line: 18, weight: '400', tracking: 0 },
  label: { size: 11, line: 14, weight: '600', tracking: 1.2 },
  data: { size: 13, line: 18, weight: '500', tracking: 0 },
} as const;

/** Movimiento sobrio y con propósito (respeta prefers-reduced-motion en cada plataforma). */
export const motion = {
  fast: 150,
  base: 200,
  slow: 250,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

/** Tamaño mínimo de objetivos táctiles (WCAG 2.2 / uso con guantes en obra). */
export const touch = { min: 44, field: 56 } as const;

export type Status = 'ok' | 'warn' | 'danger' | 'info';

/** Semáforo de revisión. El estado nunca depende solo del color: icono + texto + color. */
export const statusMeta: Record<Status, { label: string; labelEn: string; icon: IconName }> = {
  ok: { label: 'Correcto', labelEn: 'Correct', icon: 'statusOk' },
  warn: { label: 'Revisar', labelEn: 'Review', icon: 'statusWarn' },
  danger: { label: 'Problema', labelEn: 'Issue', icon: 'statusDanger' },
  info: { label: 'Información', labelEn: 'Information', icon: 'statusInfo' },
};
