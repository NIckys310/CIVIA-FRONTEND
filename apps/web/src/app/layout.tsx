import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { themeBootScript } from '@/lib/prefs';

import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CIVIA AI', template: '%s · CIVIA AI' },
  description: 'El copiloto digital del ingeniero civil: planos, normativa, cálculo y obra en un solo lugar.',
  applicationName: 'CIVIA AI',
  appleWebApp: { capable: true, title: 'CIVIA', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon.svg', apple: '/icons/icon-maskable.svg' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F4F0' },
    { media: '(prefers-color-scheme: dark)', color: '#0A111D' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // El nonce lo genera proxy.ts en cada petición (CSP estricta).
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="es-CO" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
