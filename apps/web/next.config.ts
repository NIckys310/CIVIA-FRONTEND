import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // La cámara se habilitará solo en las rutas de CIVIA Measure cuando existan.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/**
 * Backend al que se reenvía /api/v1/* (CIVIA-BACKEND). En Vercel: variable API_PROXY_TARGET
 * con la URL de Render. En desarrollo: la API local.
 */
const API_PROXY_TARGET = (process.env.API_PROXY_TARGET ?? 'http://localhost:8000').replace(/\/$/, '');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@civia/ui', '@civia/api-client', '@civia/shared-types'],
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${API_PROXY_TARGET}/api/v1/:path*` }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default config;
