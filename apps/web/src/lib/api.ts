'use client';

import { createCiviaClient } from '@civia/api-client';

import { useSession } from './session';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** Cliente único del navegador. El access token vive solo en memoria de este módulo. */
export const civia = createCiviaClient({
  baseUrl: API_URL,
  mode: 'web',
  onSessionExpired: () => useSession.getState().expire(),
});
