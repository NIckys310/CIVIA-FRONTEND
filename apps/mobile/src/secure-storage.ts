/**
 * Almacén seguro: Keychain (iOS) / Keystore (Android) mediante expo-secure-store.
 * En la vista previa web (solo desarrollo) no hay almacén seguro: se usa memoria volátil,
 * nunca localStorage, así que la sesión no sobrevive a recargar la página.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memory = new Map<string, string>();
const isWeb = Platform.OS === 'web';

export async function getSecure(key: string): Promise<string | null> {
  return isWeb ? (memory.get(key) ?? null) : SecureStore.getItemAsync(key);
}

export async function setSecure(key: string, value: string): Promise<void> {
  if (isWeb) {
    memory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function deleteSecure(key: string): Promise<void> {
  if (isWeb) memory.delete(key);
  else await SecureStore.deleteItemAsync(key);
}
