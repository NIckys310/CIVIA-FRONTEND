import type { Me } from '@civia/shared-types';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { getSecure, setSecure } from './secure-storage';

type Status = 'loading' | 'locked' | 'authenticated' | 'anonymous';

const BIOMETRIC_KEY = 'civia.biometric';
/** Tras este tiempo en segundo plano se exige desbloqueo biométrico (MASVS-AUTH). */
export const INACTIVITY_LOCK_MS = 5 * 60 * 1000;

interface SessionState {
  status: Status;
  me: Me | null;
  organizationId: string | null;
  biometricEnabled: boolean;
  setMe(me: Me): void;
  lock(): void;
  expire(): void;
  setBiometricEnabled(enabled: boolean): Promise<void>;
}

export const useSession = create<SessionState>()((set) => ({
  status: 'loading',
  me: null,
  organizationId: null,
  biometricEnabled: false,
  setMe: (me) =>
    set((s) => ({
      me,
      status: 'authenticated',
      organizationId:
        me.memberships.find((m) => m.organization_id === s.organizationId)?.organization_id ??
        me.memberships[0]?.organization_id ??
        null,
    })),
  lock: () => set({ status: 'locked' }),
  // Al expirar se borra todo lo sensible en memoria.
  expire: () => set({ status: 'anonymous', me: null }),
  async setBiometricEnabled(enabled) {
    await setSecure(BIOMETRIC_KEY, enabled ? '1' : '0');
    set({ biometricEnabled: enabled });
  },
}));

export async function loadBiometricPreference(): Promise<boolean> {
  const enabled = (await getSecure(BIOMETRIC_KEY)) === '1';
  useSession.setState({ biometricEnabled: enabled });
  return enabled;
}

export async function biometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
}

export async function unlockWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear CIVIA',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });
  return result.success;
}
