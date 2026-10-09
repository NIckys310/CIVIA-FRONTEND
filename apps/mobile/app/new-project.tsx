import { ApiError } from '@civia/api-client';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Banner, Button, Field, Label } from '@/components/ui';
import { useCreateProject } from '@/queries';
import { useTheme } from '@/theme';

export default function NewProject() {
  const { c, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const create = useCreateProject();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();

  const submit = async () => {
    if (name.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    setNameError(undefined);
    try {
      await create.mutateAsync({ name: name.trim(), location: location.trim() || null });
      router.back();
    } catch {
      /* el error se muestra desde create.error */
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ presentation: 'modal' }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Label color={c.brand}>Nueva carpeta de obra</Label>
          <Text accessibilityRole="header" style={{ color: c.text, fontSize: 26, fontWeight: '700' }}>
            Crear proyecto
          </Text>
        </View>
        {create.error ? (
          <Banner tone="danger" text={create.error instanceof ApiError ? create.error.message : 'No fue posible crear el proyecto.'} />
        ) : null}
        <Field label="Nombre del proyecto" placeholder="Ej. Edificio Torre Norte" value={name} onChangeText={setName} error={nameError} autoFocus />
        <Field label="Ubicación" placeholder="Ej. Medellín, Antioquia" value={location} onChangeText={setLocation} />
        <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: c.borderStrong, backgroundColor: c.surfaceAlt }}>
          <Icon name="library" color={c.brand} size={18} />
          <Text style={{ flex: 1, color: c.textMuted, fontSize: 13 }}>Se revisará con NSR-10 (2010). Podrás cambiar la normativa más adelante.</Text>
        </View>
        <Button title="Crear proyecto" icon="plus" onPress={() => void submit()} loading={create.isPending} />
        <Button title="Cancelar" variant="secondary" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
