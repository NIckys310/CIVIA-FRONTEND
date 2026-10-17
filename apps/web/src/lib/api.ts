'use client';

import { createCiviaClient } from '@civia/api-client';

import { useSession } from './session';

/**
 * Por defecto la API se llama en el MISMO dominio (/api/v1/*) y Next.js la reenvía al backend
 * (ver `src/app/api/v1/[...path]/route.ts`). Así la cookie de sesión es de primera parte
 * (SameSite=Strict) y no hace falta CORS. NEXT_PUBLIC_API_URL solo para apuntar a otro origen.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/** Cliente único del navegador. El access token vive solo en memoria de este módulo. */
export const civia = createCiviaClient({
  baseUrl: API_URL,
  mode: 'web',
  onSessionExpired: () => useSession.getState().expire(),
});
