'use client';

import { useEffect } from 'react';

import { civia } from './api';
import { usePrefs } from './prefs';
import { useSession } from './session';

/** Carga /me y fija la organización activa (la guardada si sigue siendo válida, o la primera). */
export async function loadMe(): Promise<void> {
  const me = await civia.unwrap(civia.api.GET('/api/v1/me'));
  const stored = usePrefs.getState().organizationId;
  const valid = me.memberships.find((m) => m.organization_id === stored);
  const orgId = valid?.organization_id ?? me.memberships[0]?.organization_id ?? null;
  usePrefs.getState().setOrganization(orgId);
  civia.setOrganization(orgId);
  useSession.getState().setMe(me);
}

/** Al abrir la app intenta recuperar la sesión desde la cookie HttpOnly de refresco. */
export function useSessionBootstrap(): void {
  const status = useSession((s) => s.status);
  useEffect(() => {
    if (status !== 'loading') return;
    let cancelled = false;
    (async () => {
      try {
        if (await civia.auth.restore()) {
          await loadMe();
          return;
        }
      } catch {
        /* API no disponible o sesión inválida */
      }
      if (!cancelled) useSession.getState().expire();
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);
}
