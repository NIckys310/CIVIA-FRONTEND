import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import { Label } from './ui';

/** Pantalla con desplazamiento, márgenes seguros y cabecera grande. */
export function Screen({
  eyebrow,
  title,
  subtitle,
  children,
  refreshing,
  onRefresh,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 16, paddingBottom: 32, gap: 20 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.brand} /> : undefined}
    >
      <View style={{ gap: 4 }}>
        {eyebrow ? <Label color={c.brand}>{eyebrow}</Label> : null}
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>
          {title}
        </Text>
        {subtitle ? <Text style={{ color: c.textMuted, fontSize: 15 }}>{subtitle}</Text> : null}
      </View>
      {children}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }} />
        <Text style={{ color: c.textSubtle, fontSize: 12, flex: 1 }}>
          Requiere revisión y aprobación del profesional responsable.
        </Text>
      </View>
    </ScrollView>
  );
}
