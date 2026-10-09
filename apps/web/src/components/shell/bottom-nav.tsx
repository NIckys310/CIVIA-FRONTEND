'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useT } from '@/lib/i18n';

import { cn } from '../ui/cn';
import { Icon } from '../ui/icon';
import { isActive, MOBILE_NAV } from './nav';

/** Navegación inferior móvil, accesible con una mano (objetivos ≥ 56 px). */
export function BottomNav() {
  const t = useT();
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const measure = item.href === '/measure';
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  active ? 'text-brand' : 'text-muted',
                )}
              >
                {measure ? (
                  <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_8px_20px_-6px_var(--c-accent)] ring-4 ring-surface">
                    <Icon name={item.icon} size={22} strokeWidth={1.75} />
                  </span>
                ) : (
                  <Icon name={item.icon} size={22} strokeWidth={active ? 1.9 : 1.5} />
                )}
                <span>{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
