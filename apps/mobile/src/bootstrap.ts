import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { civia, hasStoredSession } from './api';
import { INACTIVITY_LOCK_MS, loadBiometricPreference, useSession } from './session';

export async function loadMe(): Promise<void> {
  const me = await civia.unwrap(civia.api.GET('/api/v1/me'));
  useSession.getState().setMe(me);
  civia.setOrganization(useSession.getState().organizationId);
}

/** Restaura la sesión guardada en el almacén seguro (sin pedir contraseña). */
export async function resumeSession(): Promise<boolean> {
  try {
    if (await civia.auth.restore()) {
      await loadMe();
      return true;
    }
  } catch {
    /* sin red o API caída */
  }
  useSession.getState().expire();
  return false;
}

/** Arranque: si hay sesión y biometría activada, se pide desbloqueo antes de mostrar datos. */
export function useBootstrap(): void {
  useEffect(() => {
    void (async () => {
      const biometric = await loadBiometricPreference();
      if (!(await hasStoredSession())) return useSession.getState().expire();
      if (biometric) return useSession.getState().lock();
      await resumeSession();
    })();
  }, []);
}

/** Bloqueo por inactividad: al volver de segundo plano tras 5 min, exige biometría. */
export function useInactivityLock(): void {
  const backgroundedAt = useRef<number | null>(null);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const { status, biometricEnabled, lock } = useSession.getState();
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current !== null) {
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (status === 'authenticated' && biometricEnabled && elapsed > INACTIVITY_LOCK_MS) lock();
      }
    });
    return () => sub.remove();
  }, []);
}
