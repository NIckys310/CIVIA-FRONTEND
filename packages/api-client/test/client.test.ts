import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCiviaClient, type SecureTokenStorage } from '../src/index.ts';

function memoryStorage(initial: string | null = null): SecureTokenStorage & { value: string | null } {
  return {
    value: initial,
    async getRefreshToken() {
      return this.value;
    },
    async setRefreshToken(t) {
      this.value = t;
    },
  };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('login móvil guarda el refresh token en el almacén seguro y no en memoria JS', async () => {
  const storage = memoryStorage();
  const client = createCiviaClient({
    baseUrl: 'http://api',
    mode: 'mobile',
    storage,
    fetch: async () => json({ access_token: 'A1', expires_in: 600, refresh_token: 'R1' }),
  });
  await client.auth.login({ email: 'a@b.co', password: 'x' });
  assert.equal(storage.value, 'R1');
  assert.equal(client.isAuthenticated, true);
});

test('un 401 dispara un único refresco compartido y reintenta las peticiones', async () => {
  const storage = memoryStorage('R1');
  let refreshCalls = 0;
  let token = 'A1';
  const client = createCiviaClient({
    baseUrl: 'http://api',
    mode: 'mobile',
    storage,
    fetch: async (input) => {
      const req = input instanceof Request ? input : new Request(input);
      if (req.url.endsWith('/auth/login')) return json({ access_token: 'A1', expires_in: 600 });
      if (req.url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        await new Promise((r) => setTimeout(r, 10));
        token = 'A2';
        return json({ access_token: 'A2', expires_in: 600, refresh_token: 'R2' });
      }
      const auth = req.headers.get('Authorization');
      return auth === `Bearer ${token}` && token === 'A2'
        ? json({ user: { id: '1' }, memberships: [] })
        : json({ detail: 'expirada' }, 401);
    },
  });
  await client.auth.login({ email: 'a@b.co', password: 'x' });
  const results = await Promise.all([client.api.GET('/api/v1/me'), client.api.GET('/api/v1/me')]);
  assert.equal(refreshCalls, 1);
  assert.ok(results.every((r) => r.response.status === 200));
  assert.equal(storage.value, 'R2');
});

test('si el refresco falla se limpia la sesión y se notifica', async () => {
  const storage = memoryStorage('R1');
  let expired = false;
  const client = createCiviaClient({
    baseUrl: 'http://api',
    mode: 'mobile',
    storage,
    onSessionExpired: () => {
      expired = true;
    },
    fetch: async (input) => {
      const req = input instanceof Request ? input : new Request(input);
      if (req.url.endsWith('/auth/login')) return json({ access_token: 'A1', expires_in: 600 });
      return json({ detail: 'no' }, 401);
    },
  });
  await client.auth.login({ email: 'a@b.co', password: 'x' });
  const res = await client.api.GET('/api/v1/me');
  assert.equal(res.response.status, 401);
  assert.equal(expired, true);
  assert.equal(storage.value, null);
  assert.equal(client.isAuthenticated, false);
});

test('el modo web envía la cabecera anti-CSRF y nunca un refresh token en el cuerpo', async () => {
  let seen: RequestInit | undefined;
  const client = createCiviaClient({
    baseUrl: 'http://api',
    mode: 'web',
    fetch: async (_input, init) => {
      seen = init;
      return json({ access_token: 'A', expires_in: 600 });
    },
  });
  assert.equal(await client.auth.restore(), true);
  assert.equal((seen?.headers as Record<string, string>)['X-Requested-With'], 'civia');
  assert.equal(seen?.body, undefined);
  assert.equal(seen?.credentials, 'include');
});

test('login con MFA devuelve el desafío y no inicia sesión hasta verificar el código', async () => {
  const storage = memoryStorage();
  const calls: string[] = [];
  const client = createCiviaClient({
    baseUrl: 'http://api',
    mode: 'mobile',
    storage,
    fetch: async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      calls.push(url);
      if (url.endsWith('/auth/login')) return json({ mfa_required: true, mfa_token: 'CH' });
      const body = JSON.parse(String(init?.body)) as { mfa_token: string; code: string };
      assert.equal(body.mfa_token, 'CH');
      assert.equal(body.code, '123456');
      return json({ access_token: 'A', expires_in: 600, refresh_token: 'R' });
    },
  });
  const step1 = await client.auth.login({ email: 'a@b.co', password: 'x' });
  assert.deepEqual(step1, { mfaRequired: true, mfaToken: 'CH' });
  assert.equal(client.isAuthenticated, false);
  await client.auth.verifyMfa({ mfaToken: 'CH', code: '123456' });
  assert.equal(client.isAuthenticated, true);
  assert.equal(storage.value, 'R');
  assert.ok(calls.at(-1)?.endsWith('/auth/mfa/verify'));
});
