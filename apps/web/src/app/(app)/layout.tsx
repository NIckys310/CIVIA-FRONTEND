'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { LoadingScreen } from '@/components/brand/loading-screen';
import { BottomNav } from '@/components/shell/bottom-nav';
import { CommandPalette } from '@/components/shell/command-palette';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { useT } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useSessionBootstrap } from '@/lib/use-session-bootstrap';

/**
 * Shell a pantalla completa: barra lateral fija + área de trabajo con desplazamiento propio
 * (escritorio/tableta) y barra inferior (móvil). Protege todas las rutas internas.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const status = useSession((s) => s.status);
  const [searchOpen, setSearchOpen] = useState(false);
  useSessionBootstrap();

  useEffect(() => {
    if (status === 'anonymous') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status !== 'authenticated') return <LoadingScreen />;

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        {t('common.skipToContent')}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSearch={() => setSearchOpen(true)} />
        <main id="main" className="scrollbar-thin flex-1 overflow-y-auto pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
