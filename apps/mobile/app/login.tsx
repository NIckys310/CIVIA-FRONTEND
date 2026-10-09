import { ApiError } from '@civia/api-client';
import * as Device from 'expo-device';
import { Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { civia } from '@/api';
import { loadMe } from '@/bootstrap';
import { Icon } from '@/components/icon';
import { Banner, BlueprintBackground, Button, Field, Label, LogoMark } from '@/components/ui';
import { useSession } from '@/session';
import { useTheme } from '@/theme';

/** Pórtico decorativo de la cabecera: ejes, vigas y la columna C-07 en revisión. */
function HeaderFrame() {
  const { c } = useTheme();
  return (
    <Svg width="100%" height={150} viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice">
      <Path
        d="M60 0v150M180 0v150M300 0v150"
        stroke={c.brand}
        strokeOpacity={0.45}
        strokeDasharray="12 4 2 4"
      />
      <Path
        d="M30 40h300M30 120h300"
        stroke={c.brand}
        strokeOpacity={0.45}
        strokeDasharray="12 4 2 4"
      />
      <Path
        d="M60 40h240v80H60z M180 40v80"
        stroke={c.text}
        strokeOpacity={0.7}
        strokeWidth={2}
        fill="none"
      />
      {[60, 180, 300].flatMap((x) =>
        [40, 120].map((y) => (
          <Rect key={`${x}-${y}`} x={x - 6} y={y - 6} width={12} height={12} fill={c.text} />
        )),
      )}
      <Rect x={290} y={30} width={20} height={20} stroke={c.accent} strokeWidth={2} fill="none" />
    </Svg>
  );
}

export default function Login() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const status = useSession((s) => s.status);
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState('');

  if (status === 'authenticated') return <Redirect href="/(tabs)" />;

  const submit = async () => {
    if (!email.includes('@') || !password) {
      setError('Ingresa tu correo y tu contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await civia.auth.login({
        email: email.trim(),
        password,
        device_label: `CIVIA móvil · ${Device.modelName ?? Platform.OS}`,
      });
      setPassword('');
      if (result.mfaRequired) setMfaToken(result.mfaToken);
      else await loadMe();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'No fue posible conectar con CIVIA. Revisa tu conexión.',
      );
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!mfaToken) return;
    setError(null);
    setLoading(true);
    try {
      // Acepta el código TOTP de 6 dígitos o un código de recuperación (XXXXX-XXXXX).
      const value = code.trim();
      await civia.auth.verifyMfa(
        /^\d{6}$/.test(value) ? { mfaToken, code: value } : { mfaToken, recoveryCode: value },
      );
      await loadMe();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No fue posible verificar el código.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View
          style={{
            height: 210 + insets.top,
            borderBottomWidth: 1,
            borderColor: c.border,
            overflow: 'hidden',
          }}
        >
          <BlueprintBackground />
          <View
            style={{
              paddingTop: insets.top + 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <LogoMark size={34} />
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
              CIVIA
            </Text>
            <Label color={c.brand}>AI</Label>
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
            <HeaderFrame />
          </View>
        </View>

        <View
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 28,
            gap: 20,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View style={{ gap: 6 }}>
            <Label color={c.brand}>CIVIA · Login</Label>
            <Text style={{ color: c.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>
              Abrir libro de obra
            </Text>
            <Text style={{ color: c.textMuted, fontSize: 15 }}>
              Ingresa con tu cuenta profesional para continuar.
            </Text>
          </View>

          {error ? <Banner tone="danger" text={error} /> : null}

          {mfaToken ? (
            <View style={{ gap: 16 }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>
                Verificación en dos pasos
              </Text>
              <Text style={{ color: c.textMuted, fontSize: 15 }}>
                Ingresa el código de 6 dígitos de tu aplicación de autenticación o un código de
                recuperación.
              </Text>
              <Field
                label="Código"
                value={code}
                onChangeText={setCode}
                autoFocus
                autoCapitalize="characters"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                returnKeyType="go"
                onSubmitEditing={() => void verify()}
              />
              <Button
                title="Verificar"
                icon="shield"
                onPress={() => void verify()}
                loading={loading}
              />
              <Button
                title="Volver"
                variant="secondary"
                onPress={() => {
                  setMfaToken(null);
                  setCode('');
                  setError(null);
                }}
              />
            </View>
          ) : (
            <>
              <Field
                label="Correo profesional"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <Field
                ref={passwordRef}
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                secure
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
              />
              <Button
                title="Ingresar"
                icon="arrowRight"
                onPress={() => void submit()}
                loading={loading}
              />
            </>
          )}

          <View
            style={{
              marginTop: 'auto',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Icon name="lock" color={c.textSubtle} size={14} />
            <Text style={{ color: c.textSubtle, fontSize: 12 }}>
              Conexión cifrada · Sesiones auditadas · Ley 1581
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
