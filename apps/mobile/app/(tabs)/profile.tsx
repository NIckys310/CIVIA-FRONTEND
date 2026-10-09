import { roleLabels } from '@civia/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { civia } from '@/api';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Button, Card, Label } from '@/components/ui';
import { useRevokeSession, useSessions } from '@/queries';
import { biometricAvailable, unlockWithBiometrics, useSession } from '@/session';
import { monoFamily, useTheme } from '@/theme';

export default function Profile() {
  const { c } = useTheme();
  const qc = useQueryClient();
  const me = useSession((s) => s.me);
  const biometricEnabled = useSession((s) => s.biometricEnabled);
  const setBiometricEnabled = useSession((s) => s.setBiometricEnabled);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const sessions = useSessions();
  const revoke = useRevokeSession();

  useEffect(() => {
    void biometricAvailable().then(setCanUseBiometrics);
  }, []);

  if (!me) return null;

  const toggleBiometric = async (value: boolean) => {
    // Activar exige confirmar la identidad primero.
    if (value && !(await unlockWithBiometrics())) return;
    await setBiometricEnabled(value);
  };

  const logout = async () => {
    await civia.auth.logout(); // revoca en servidor y borra el token del almacén seguro
    qc.clear();
    useSession.getState().expire();
  };

  return (
    <Screen eyebrow="Perfil" title={me.user.full_name} subtitle={me.user.email}>
      <Card style={{ gap: 10 }}>
        <Label>Organizaciones</Label>
        {me.memberships.map((m) => (
          <View key={m.organization_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="organization" color={c.brand} size={18} />
            <Text style={{ flex: 1, color: c.text, fontSize: 15, fontWeight: '600' }}>{m.organization_name}</Text>
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{roleLabels[m.role].es}</Text>
          </View>
        ))}
      </Card>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="shield" color={c.brand} size={22} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>Desbloqueo biométrico</Text>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            {canUseBiometrics ? 'Huella o Face ID al abrir y tras 5 min de inactividad.' : 'No disponible en este dispositivo.'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Desbloqueo biométrico"
          value={biometricEnabled}
          disabled={!canUseBiometrics}
          onValueChange={(v) => void toggleBiometric(v)}
          trackColor={{ true: c.brand, false: c.border }}
        />
      </Card>

      <Card style={{ gap: 4 }}>
        <Label>Dispositivos activos</Label>
        {sessions.data?.map((s) => (
          <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
            <Icon name={/móvil|android|iphone/i.test(s.device_label ?? '') ? 'device' : 'monitor'} color={c.textMuted} size={20} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>
                {s.device_label || 'Dispositivo desconocido'}
                {s.current ? '  · Este dispositivo' : ''}
              </Text>
              <Text style={{ color: c.textSubtle, fontSize: 12, fontFamily: monoFamily }}>{s.ip_address ?? '—'}</Text>
            </View>
            {s.current ? null : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Cerrar sesión en ${s.device_label ?? 'dispositivo'}`}
                onPress={() => revoke.mutate(s.id)}
                style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 8 }}
              >
                <Text style={{ color: c.danger, fontWeight: '600' }}>Cerrar</Text>
              </Pressable>
            )}
          </View>
        ))}
      </Card>

      <Button title="Cerrar sesión" variant="danger" icon="logout" onPress={() => void logout()} />
    </Screen>
  );
}
