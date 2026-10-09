import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../theme';
import { BlueprintBackground } from './ui';

export function LoadingView() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }} accessibilityRole="progressbar">
      <BlueprintBackground />
      <Svg width={160} height={96} viewBox="0 0 160 96">
        <Path d="M20 4v88M80 4v88M140 4v88" stroke={c.brand} strokeOpacity={0.5} strokeDasharray="8 3 2 3" />
        <Path d="M20 86V22h120v64M80 22v64" stroke={c.text} strokeWidth={2.5} fill="none" />
        <Path d="M8 90h144" stroke={c.textMuted} />
        <Circle cx={140} cy={22} r={4} fill={c.accent} />
      </Svg>
      <Text style={{ color: c.textMuted, fontSize: 14 }}>Preparando tu libro de obra…</Text>
    </View>
  );
}
