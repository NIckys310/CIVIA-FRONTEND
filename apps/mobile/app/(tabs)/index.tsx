import type { IconName } from '@civia/ui';
import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ProjectRow } from '@/components/project-row';
import { Screen } from '@/components/screen';
import { Card, Label } from '@/components/ui';
import { useProjects } from '@/queries';
import { useSession } from '@/session';
import { monoFamily, useTheme } from '@/theme';

const ACTIONS: Array<{ title: string; desc: string; icon: IconName; href: Href; primary?: boolean; axis: string }> = [
  { title: 'Analizar plano', desc: 'Detecta elementos e inconsistencias', icon: 'analyze', href: '/projects', primary: true, axis: 'A' },
  { title: 'Medir', desc: 'Mide en obra con tu celular', icon: 'measure', href: '/measure', axis: 'B' },
  { title: 'Crear proyecto', desc: 'Nueva carpeta de obra', icon: 'plus', href: '/new-project', axis: 'C' },
  { title: 'Modelo 3D', desc: 'Estructura por niveles', icon: 'model3d', href: '/projects', axis: 'D' },
];

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export default function Home() {
  const { c, radius } = useTheme();
  const router = useRouter();
  const me = useSession((s) => s.me);
  const { data: projects, isLoading, refetch, isRefetching } = useProjects();
  const firstName = me?.user.full_name.split(' ')[0] ?? '';
  const date = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <Screen eyebrow={date} title={`${greeting()}, ${firstName}.`} subtitle="¿Qué vamos a revisar hoy?" refreshing={isRefetching} onRefresh={() => void refetch()}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.title}
            accessibilityRole="button"
            accessibilityLabel={`${a.title}. ${a.desc}`}
            onPress={() => router.push(a.href)}
            style={({ pressed }) => ({
              width: '48%',
              flexGrow: 1,
              minHeight: 150,
              padding: 16,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              justifyContent: 'space-between',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: a.primary ? c.accent : c.brandSoft,
                }}
              >
                <Icon name={a.icon} color={a.primary ? c.onAccent : c.brand} size={24} />
              </View>
              <Text style={{ fontFamily: monoFamily, color: c.textSubtle, fontSize: 11, fontWeight: '700' }}>{a.axis}</Text>
            </View>
            <View style={{ gap: 2 }}>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{a.title}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13 }}>{a.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ gap: 12 }}>
        <Label>Proyectos recientes</Label>
        {isLoading ? (
          <Card>
            <Text style={{ color: c.textMuted }}>Cargando…</Text>
          </Card>
        ) : projects && projects.length > 0 ? (
          projects.slice(0, 4).map((p) => <ProjectRow key={p.id} project={p} />)
        ) : (
          <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
            <Icon name="projects" color={c.brand} size={32} />
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Tu primera carpeta de obra</Text>
            <Text style={{ color: c.textMuted, textAlign: 'center' }}>Crea un proyecto para organizar planos, cálculos y mediciones.</Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}
