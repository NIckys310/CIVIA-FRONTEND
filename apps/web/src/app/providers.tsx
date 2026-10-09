'use client';

import { ApiError } from '@civia/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { registerServiceWorker } from '@/lib/pwa';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            // Errores 4xx no se reintentan (permisos, no encontrado).
            retry: (count, error) =>
              !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
          },
        },
      }),
  );

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
