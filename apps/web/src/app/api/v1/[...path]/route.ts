/**
 * Proxy del mismo dominio hacia la API de CIVIA-BACKEND (`API_PROXY_TARGET`).
 *
 * Se hace en una función de servidor (Node) y no con `rewrites` porque la capa de borde de
 * algunas plataformas rechaza reenviar a ciertos hosts. Seguridad:
 * - Destino FIJO: solo cambia la ruta bajo /api/v1 (sin SSRF).
 * - Solo se reenvían las cabeceras que la API usa (lista blanca).
 * - Las cookies de sesión (`Set-Cookie`) pasan intactas: siguen siendo HttpOnly/Secure/Strict
 *   y de primera parte para el dominio de la web.
 */
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// El plan gratuito de Render duerme la API: la primera petición puede tardar ~50 s.
export const maxDuration = 60;

const TARGET = (process.env.API_PROXY_TARGET ?? 'http://localhost:8000').replace(/\/$/, '');

const FORWARDED_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'authorization',
  'content-type',
  'cookie',
  'user-agent',
  'x-client',
  'x-organization-id',
  'x-requested-with',
];

const DROPPED_RESPONSE_HEADERS = new Set([
  'connection',
  'content-encoding', // fetch ya descomprimió el cuerpo
  'content-length',
  'keep-alive',
  'set-cookie', // se copia aparte para conservar varias cookies
  'transfer-encoding',
]);

function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip');
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  // Cada segmento se codifica: un "../" llega como texto, nunca cambia de ruta ni de host.
  const url = `${TARGET}/api/v1/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  const ip = clientIp(req);
  if (ip) headers.set('x-forwarded-for', ip); // para el rate limiting por IP de la API

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return Response.json(
      { detail: 'El servicio no está disponible en este momento. Inténtalo de nuevo.' },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => {
    if (!DROPPED_RESPONSE_HEADERS.has(name)) responseHeaders.set(name, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie);

  return new Response(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
