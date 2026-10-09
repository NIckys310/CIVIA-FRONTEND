import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ProjectRow } from '@/components/project-row';
import { Screen } from '@/components/screen';
import { Button, Card } from '@/components/ui';
import { useProjects } from '@/queries';
import { useTheme } from '@/theme';

export default function Projects() {
  const { c } = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useProjects();

  return (
    <Screen
      eyebrow={data ? `${data.length} proyectos` : 'Proyectos'}
      title="Proyectos"
      subtitle="Carpetas de obra de tu organización."
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
    >
      <Button title="Crear proyecto" icon="plus" onPress={() => router.push('/new-project')} />
      {isLoading ? (
        <Card>
          <Text style={{ color: c.textMuted }}>Cargando…</Text>
        </Card>
      ) : isError ? (
        <Card style={{ gap: 12 }}>
          <Text style={{ color: c.textMuted }}>No pudimos cargar los proyectos.</Text>
          <Button title="Reintentar" variant="secondary" onPress={() => void refetch()} />
        </Card>
      ) : data && data.length > 0 ? (
        <View style={{ gap: 10 }}>
          {data.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </View>
      ) : (
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 32 }}>
          <Icon name="projects" color={c.brand} size={36} />
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>Tu primera carpeta de obra</Text>
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>Planos, cálculos, mediciones e informes en un solo lugar.</Text>
        </Card>
      )}
    </Screen>
  );
}
