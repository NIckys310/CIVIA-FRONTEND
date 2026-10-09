import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { civia } from '@/api';
import { resumeSession } from '@/bootstrap';
import { Icon } from '@/components/icon';
import { BlueprintBackground, Button, LogoMark } from '@/components/ui';
import { unlockWithBiometrics, useSession } from '@/session';
import { useTheme } from '@/theme';

/** Desbloqueo biométrico (huella / Face ID) al abrir la app o tras inactividad. */
export default function Unlock() {
  const { c } = useTheme();
  const status = useSession((s) => s.status);
  const [busy, setBusy] = useState(false);

  const attempt = async () => {
    setBusy(true);
    try {
      if (await unlockWithBiometrics()) {
        // Si los datos siguen en memoria basta con desbloquear; si no, se restaura la sesión.
        if (useSession.getState().me) useSession.setState({ status: 'authenticated' });
        else await resumeSession();
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void attempt();
  }, []);

  if (status === 'authenticated') return <Redirect href="/(tabs)" />;
  if (status === 'anonymous') return <Redirect href="/login" />;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
      <BlueprintBackground />
      <LogoMark size={56} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>Sesión bloqueada</Text>
        <Text style={{ color: c.textMuted, fontSize: 15, textAlign: 'center' }}>
          Desbloquea con tu huella o rostro para continuar.
        </Text>
      </View>
      <View style={{ alignSelf: 'stretch', gap: 12 }}>
        <Button title="Desbloquear" icon="shield" onPress={() => void attempt()} loading={busy} />
        <Button
          title="Usar otra cuenta"
          variant="secondary"
          onPress={() => {
            void civia.auth.logout().finally(() => useSession.getState().expire());
          }}
        />
      </View>
      <Icon name="lock" color={c.textSubtle} size={16} />
    </View>
  );
}
