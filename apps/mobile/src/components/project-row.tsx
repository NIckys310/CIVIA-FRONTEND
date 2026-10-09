import type { Project } from '@civia/shared-types';
import { Text, View } from 'react-native';

import { monoFamily, useTheme } from '../theme';
import { Icon } from './icon';

export function ProjectRow({ project }: { project: Project }) {
  const { c, radius } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${project.code}, ${project.name}, ${project.location ?? 'sin ubicación'}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.surface,
      }}
    >
      <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="plan" color={c.brand} size={24} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: monoFamily, color: c.brand, fontSize: 12, fontWeight: '700' }}>{project.code}</Text>
        <Text numberOfLines={1} style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>
          {project.name}
        </Text>
        <Text numberOfLines={1} style={{ color: c.textMuted, fontSize: 13 }}>
          {project.location || '—'} · {project.norm_code}
        </Text>
      </View>
      <Icon name="chevronRight" color={c.textSubtle} size={20} />
    </View>
  );
}
