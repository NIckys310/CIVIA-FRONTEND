/**
 * Preferencias del visor (idioma, tema, menú contraído, organización activa).
 * Solo comodidades locales: se guardan en localStorage y la app funciona sin ellas.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Locale } from './i18n';

export type ThemePref = 'system' | 'light' | 'dark';

interface PrefsState {
  locale: Locale;
  theme: ThemePref;
  sidebarCollapsed: boolean;
  organizationId: string | null;
  setLocale(locale: Locale): void;
  setTheme(theme: ThemePref): void;
  toggleSidebar(): void;
  setOrganization(id: string | null): void;
}

const safeStorage = createJSONStorage(() => {
  try {
    return window.localStorage;
  } catch {
    // Navegación privada o almacenamiento bloqueado: memoria temporal.
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
  }
});

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      locale: 'es-CO',
      theme: 'system',
      sidebarCollapsed: false,
      organizationId: null,
      setLocale: (locale) => {
        document.documentElement.lang = locale;
        set({ locale });
      },
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setOrganization: (organizationId) => set({ organizationId }),
    }),
    { name: 'civia.prefs', storage: safeStorage },
  ),
);

export function applyTheme(theme: ThemePref): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

/** Script en línea (con nonce) que aplica el tema antes del primer pintado: sin parpadeo. */
export const themeBootScript = `try{var p=JSON.parse(localStorage.getItem('civia.prefs')||'{}').state||{};if(p.theme&&p.theme!=='system')document.documentElement.setAttribute('data-theme',p.theme);if(p.locale)document.documentElement.lang=p.locale}catch(e){}`;
