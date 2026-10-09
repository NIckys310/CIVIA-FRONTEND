import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { monoFamily, useTheme } from '@/theme';

/**
 * CIVIA Measure — vista previa del HUD (Fase 4). La cámara, AR/LiDAR y la medición
 * real llegan en la Fase 4; aquí se muestra el diseño con valores de EJEMPLO rotulados.
 */
export default function Measure() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: '#141B27' }}>
      {/* Retícula tipo mira de topografía */}
      <Svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice">
        <Rect x="38" y="36" width="24" height="112" fill="#8E949D" opacity={0.55} />
        <Rect x="38" y="36" width="24" height="112" fill="none" stroke={c.accent} strokeWidth={0.8} strokeDasharray="2 1.5" />
        <Path d="M38 32v-4M62 32v-4M38 30h24" stroke={c.accent} strokeWidth={0.6} />
        <Path d="M34 36h-3M34 148h-3M32.5 36v112" stroke={c.accent} strokeWidth={0.6} />
        <Circle cx="50" cy="92" r="16" stroke="#fff" strokeWidth={0.4} fill="none" />
        <Path d="M50 70v12M50 102v12M28 92h12M60 92h12" stroke="#fff" strokeWidth={0.4} />
      </Svg>

      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pill text="ESTIMACIÓN · EJEMPLO" />
        <Pill text="Confianza 0.86" />
      </View>

      <View style={{ marginTop: 'auto', paddingHorizontal: 16, paddingBottom: 24, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            ['Ancho', '0.30'],
            ['Prof.', '0.30'],
            ['Altura', '2.95'],
          ].map(([k, v]) => (
            <View key={k} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 1 }}>{k?.toUpperCase()}</Text>
              <Text style={{ color: '#fff', fontFamily: monoFamily, fontSize: 20, fontWeight: '700' }}>{v} m</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <Icon name="camera" color="#fff" size={22} />
          <Text style={{ flex: 1, color: '#fff', fontSize: 14 }}>
            La medición con cámara, AR y LiDAR llega en la Fase 4. Siempre se mostrará como estimación con su nivel de confianza.
          </Text>
        </View>
      </View>
    </View>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}
