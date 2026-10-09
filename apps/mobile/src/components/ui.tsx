import type { IconName } from '@civia/ui';
import { forwardRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { monoFamily, useTheme } from '../theme';
import { Icon } from './icon';

/** Fondo de papel de plano (retícula menor 8 / mayor 40). */
export function BlueprintBackground({ style }: { style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="minor" width="8" height="8" patternUnits="userSpaceOnUse">
            <Path d="M8 0H0V8" fill="none" stroke={c.grid} strokeWidth="1" />
          </Pattern>
          <Pattern id="major" width="40" height="40" patternUnits="userSpaceOnUse">
            <Rect width="40" height="40" fill="url(#minor)" />
            <Path d="M40 0H0V40" fill="none" stroke={c.gridStrong} strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={c.bg} />
        <Rect width="100%" height="100%" fill="url(#major)" />
      </Svg>
    </View>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  const { c } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityLabel="CIVIA">
      <Rect width="32" height="32" rx="8" fill={c.brand} />
      <Path d="M23 9H10v14h13" stroke={c.onBrand} strokeWidth="2.4" strokeLinecap="square" fill="none" />
      <Path d="M14 9v14" stroke={c.onBrand} strokeWidth="1.2" opacity={0.55} />
      <Circle cx="23" cy="23" r="2.6" fill={c.accent} />
    </Svg>
  );
}

type Variant = 'primary' | 'secondary' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress(): void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { c, touch, radius } = useTheme();
  const bg = variant === 'primary' ? c.accent : c.surface;
  const fg = variant === 'primary' ? c.onAccent : variant === 'danger' ? c.danger : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        minHeight: touch.field,
        borderRadius: radius.lg,
        backgroundColor: bg,
        borderWidth: variant === 'primary' ? 0 : 1,
        borderColor: c.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 20,
        opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} color={fg} size={20} /> : null}
      <Text style={{ color: fg, fontSize: 16, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export const Field = forwardRef<TextInput, TextInputProps & { label: string; error?: string; secure?: boolean }>(
  function Field({ label, error, secure = false, ...props }, ref) {
    const { c, touch, radius } = useTheme();
    const [hidden, setHidden] = useState(secure);
    const [focused, setFocused] = useState(false);
    return (
      <View style={{ gap: 6 }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '500' }}>{label}</Text>
        <View
          style={{
            minHeight: touch.field,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: error ? c.danger : focused ? c.brand : c.border,
            backgroundColor: c.surface,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            placeholderTextColor={c.textSubtle}
            secureTextEntry={hidden}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ flex: 1, color: c.text, fontSize: 16, paddingHorizontal: 14, minHeight: touch.field }}
            {...props}
          />
          {secure ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
              onPress={() => setHidden((h) => !h)}
              style={{ width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={hidden ? 'eye' : 'eyeOff'} color={c.textMuted} size={20} />
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 13 }}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

export function Label({ children, color }: { children: ReactNode; color?: string }) {
  const { c } = useTheme();
  return (
    <Text style={{ fontFamily: monoFamily, fontSize: 11, fontWeight: '700', letterSpacing: 1.3, color: color ?? c.textMuted, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { c, radius } = useTheme();
  return (
    <View style={[{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: radius.lg, padding: 16 }, style]}>
      {children}
    </View>
  );
}

export function Banner({ tone, text }: { tone: 'danger' | 'ok'; text: string }) {
  const { c, radius } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: radius.md,
        backgroundColor: tone === 'danger' ? c.dangerSoft : c.okSoft,
      }}
    >
      <Icon name={tone === 'danger' ? 'statusDanger' : 'statusOk'} color={tone === 'danger' ? c.danger : c.ok} size={18} />
      <Text style={{ flex: 1, color: tone === 'danger' ? c.danger : c.ok, fontSize: 14 }}>{text}</Text>
    </View>
  );
}
