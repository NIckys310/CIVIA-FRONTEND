/**
 * Cliente tipado de la API de CIVIA, compartido por web y móvil.
 *
 * - El access token vive SOLO en memoria (nunca en localStorage).
 * - Web: el refresh token es una cookie HttpOnly que JavaScript no puede leer.
 * - Móvil: el refresh token se guarda en el almacén seguro del SO (Keychain/Keystore)
 *   a través de la interfaz `SecureTokenStorage`.
 * - Ante un 401 se intenta UN refresco (de vuelo único, compartido entre peticiones
 *   concurrentes) y se reintenta la petición original.
 */
import createClient from 'openapi-fetch';

import type {
  LoginInput,
  LoginResponse,
  paths,
  RegisterInput,
  TokenResponse,
} from '@civia/shared-types';

export type ClientMode = 'web' | 'mobile';

export interface SecureTokenStorage {
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string | null): Promise<void>;
}

export interface CiviaClientOptions {
  baseUrl: string;
  mode: ClientMode;
  /** Obligatorio en móvil. */
  storage?: SecureTokenStorage;
  /** Se llama cuando la sesión ya no puede renovarse (mostrar login). */
  onSessionExpired?: () => void;
  fetch?: typeof globalThis.fetch;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function errorFrom(res: Response): Promise<ApiError> {
  let message = 'No fue posible completar la solicitud.';
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === 'string') message = body.detail;
    else if (Array.isArray(body.detail)) message = 'Revisa los datos ingresados.';
  } catch {
    /* respuesta sin JSON */
  }
  return new ApiError(res.status, message);
}

export function createCiviaClient(options: CiviaClientOptions) {
  const baseFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const base = options.baseUrl.replace(/\/$/, '');
  let accessToken: string | null = null;
  let organizationId: string | null = null;
  let refreshing: Promise<boolean> | null = null;

  if (options.mode === 'mobile' && !options.storage) {
    throw new Error('El modo móvil requiere un SecureTokenStorage');
  }

  const modeHeaders = (): Record<string, string> =>
    options.mode === 'mobile' ? { 'X-Client': 'mobile' } : { 'X-Requested-With': 'civia' };

  async function acceptTokens(tokens: TokenResponse | LoginResponse): Promise<void> {
    if (!tokens.access_token) throw new ApiError(500, 'Respuesta de sesión incompleta.');
    accessToken = tokens.access_token;
    if (options.mode === 'mobile' && tokens.refresh_token) {
      await options.storage!.setRefreshToken(tokens.refresh_token);
    }
  }

  async function clearSession(): Promise<void> {
    accessToken = null;
    if (options.mode === 'mobile') await options.storage!.setRefreshToken(null);
  }

  async function doRefresh(): Promise<boolean> {
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...modeHeaders() },
      credentials: 'include',
    };
    if (options.mode === 'mobile') {
      const stored = await options.storage!.getRefreshToken();
      if (!stored) return false;
      init.body = JSON.stringify({ refresh_token: stored });
    }
    const res = await baseFetch(`${base}/api/v1/auth/refresh`, init);
    if (!res.ok) {
      // 409 = otra petición está rotando el token ahora mismo: no es una expiración.
      if (res.status !== 409) await clearSession();
      return false;
    }
    await acceptTokens((await res.json()) as TokenResponse);
    return true;
  }

  /** Renueva la sesión; las llamadas concurrentes comparten la misma promesa. */
  function refresh(): Promise<boolean> {
    refreshing ??= doRefresh().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  async function authedFetch(input: Request): Promise<Response> {
    const send = (req: Request): Promise<Response> => {
      const headers = new Headers(req.headers);
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
      if (organizationId && !headers.has('X-Organization-Id')) {
        headers.set('X-Organization-Id', organizationId);
      }
      return baseFetch(new Request(req, { headers, credentials: 'include' }));
    };
    const retryable = input.clone();
    const res = await send(input);
    if (res.status !== 401 || !accessToken) return res;
    if (await refresh()) return send(retryable);
    options.onSessionExpired?.();
    return res;
  }

  const api = createClient<paths>({ baseUrl: base, fetch: authedFetch });

  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await baseFetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...modeHeaders() },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await errorFrom(res);
    return (await res.json()) as T;
  }

  return {
    api,
    setOrganization(id: string | null) {
      organizationId = id;
    },
    get isAuthenticated() {
      return accessToken !== null;
    },
    auth: {
      async register(input: RegisterInput): Promise<void> {
        await post('/api/v1/auth/register', input);
      },
      async login(input: LoginInput): Promise<LoginResult> {
        const res = await post<LoginResponse>('/api/v1/auth/login', input);
        if (res.mfa_required && res.mfa_token) return { mfaRequired: true, mfaToken: res.mfa_token };
        await acceptTokens(res);
        return { mfaRequired: false };
      },
      /** Paso 2: código TOTP de 6 dígitos o código de recuperación. */
      async verifyMfa(input: { mfaToken: string; code?: string; recoveryCode?: string }): Promise<void> {
        await acceptTokens(
          await post<TokenResponse>('/api/v1/auth/mfa/verify', {
            mfa_token: input.mfaToken,
            code: input.code ?? null,
            recovery_code: input.recoveryCode ?? null,
          }),
        );
      },
      /** Intenta recuperar la sesión al abrir la app (cookie o almacén seguro). */
      restore: refresh,
      async logout(): Promise<void> {
        if (accessToken) {
          await authedFetch(
            new Request(`${base}/api/v1/auth/logout`, { method: 'POST', headers: modeHeaders() }),
          ).catch(() => undefined);
        }
        await clearSession();
      },
    },
    /** Lanza ApiError si la respuesta no es exitosa; devuelve los datos tipados. */
    async unwrap<T>(
      promise: Promise<{ data?: T; error?: unknown; response: Response }>,
    ): Promise<T> {
      const { data, response } = await promise;
      if (!response.ok || data === undefined) {
        if (response.ok) return undefined as T;
        throw await errorFrom(response.clone());
      }
      return data;
    },
  };
}

export type CiviaClient = ReturnType<typeof createCiviaClient>;

/** Resultado del paso 1 del login: sesión iniciada o segundo factor pendiente. */
export type LoginResult = { mfaRequired: false } | { mfaRequired: true; mfaToken: string };
