import { createCiviaClient, type SecureTokenStorage } from '@civia/api-client';

import { deleteSecure, getSecure, setSecure } from './secure-storage';
import { useSession } from './session';

const REFRESH_KEY = 'civia.refresh';

/**
 * El refresh token vive en Keychain (iOS) / Keystore (Android) y solo es accesible
 * con el dispositivo desbloqueado, sin sincronizarse a copias de seguridad.
 */
const secureStorage: SecureTokenStorage = {
  getRefreshToken: () => getSecure(REFRESH_KEY),
  setRefreshToken: (token) => (token ? setSecure(REFRESH_KEY, token) : deleteSecure(REFRESH_KEY)),
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000';

export const civia = createCiviaClient({
  baseUrl: API_URL,
  mode: 'mobile',
  storage: secureStorage,
  onSessionExpired: () => useSession.getState().expire(),
});

export async function hasStoredSession(): Promise<boolean> {
  return (await secureStorage.getRefreshToken()) !== null;
}
