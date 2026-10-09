import { font, palette, radius, space, touch, type ThemeName } from '@civia/ui';
import { Platform, useColorScheme } from 'react-native';

export type Colors = (typeof palette)[ThemeName];

export function useTheme() {
  const scheme: ThemeName = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, c: palette[scheme] as Colors, space, radius, touch };
}

/** Familia monoespaciada nativa para datos técnicos (C-01, 30×30 cm, 8Ø16). */
export const monoFamily = Platform.select({ ios: 'Menlo', android: 'monospace', default: font.mono });
