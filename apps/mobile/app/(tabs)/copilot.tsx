import { Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Card, Label } from '@/components/ui';
import { monoFamily, useTheme } from '@/theme';

/** CIVIA Copilot — vista previa (Fase 1). Responde solo con fuentes citadas. */
export default function Copilot() {
  const { c, radius } = useTheme();
  return (
    <Screen eyebrow="Fase 1 · En construcción" title="Copilot" subtitle="Pregunta sobre planos, hallazgos y normativa. Siempre con citas.">
      <Card style={{ gap: 12 }}>
        <Label>Ejemplo</Label>
        <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: c.brand, padding: 12, borderRadius: radius.lg, borderBottomRightRadius: 4 }}>
          <Text style={{ color: c.onBrand, fontSize: 15 }}>Explícame el hallazgo de la columna C-07.</Text>
        </View>
        <View style={{ maxWidth: '92%', backgroundColor: c.surfaceAlt, padding: 12, borderRadius: radius.lg, borderBottomLeftRadius: 4, gap: 10 }}>
          <Text style={{ color: c.text, fontSize: 15, lineHeight: 21 }}>
            Posible inconsistencia: la columna C-07 aparece en N+3.00 pero no en N+6.00. Se recomienda revisar la continuidad del elemento.
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {['NSR-10 · Título C', 'E-03 · p.1'].map((chip) => (
              <View key={chip} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface }}>
                <Icon name="library" color={c.brand} size={12} />
                <Text style={{ color: c.brand, fontFamily: monoFamily, fontSize: 11 }}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
      <Text style={{ color: c.textMuted, fontSize: 13 }}>
        Los cálculos los hace el motor de ingeniería, no la IA. Si no hay soporte en una fuente, Copilot lo dice.
      </Text>
    </Screen>
  );
}
