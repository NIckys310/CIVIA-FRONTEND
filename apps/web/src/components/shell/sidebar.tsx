'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useT } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs';

import { Logo } from '../brand/logo';
import { cn } from '../ui/cn';
import { Icon } from '../ui/icon';
import { isActive, NAV_SECTIONS } from './nav';
import { OrgSwitcher } from './org-switcher';

export function Sidebar() {
  const t = useT();
  const pathname = usePathname();
  const collapsed = usePrefs((s) => s.sidebarCollapsed);
  const toggle = usePrefs((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-civia md:flex',
        collapsed ? 'w-[76px]' : 'w-[264px]',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center' : 'px-5')}>
        <Link href="/" aria-label="CIVIA — inicio">
          <Logo compact={collapsed} />
        </Link>
      </div>

      <div className={cn('pt-4', collapsed ? 'px-3' : 'px-4')}>
        <OrgSwitcher collapsed={collapsed} />
      </div>

      <nav aria-label="Principal" className="scrollbar-thin flex-1 overflow-y-auto py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className={cn('mb-5', collapsed ? 'px-3' : 'px-4')}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-border" />
            ) : (
              <h2 className="label-tech mb-2 px-2 text-subtle">{t(section.title)}</h2>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? t(item.label) : undefined}
                      className={cn(
                        'group relative flex h-10 items-center gap-3 rounded-md text-[14px] transition-colors duration-150',
                        collapsed ? 'justify-center' : 'px-2.5',
                        active
                          ? 'bg-brand-soft font-semibold text-brand'
                          : 'text-muted hover:bg-surface-alt hover:text-text',
                      )}
                    >
                      {active ? (
                        <span className="absolute -left-4 top-2 bottom-2 w-[3px] rounded-r bg-brand" aria-hidden="true" />
                      ) : null}
                      <Icon name={item.icon} size={20} />
                      {collapsed ? null : <span className="flex-1 truncate">{t(item.label)}</span>}
                      {!collapsed && item.phase ? (
                        <span className="font-data text-[10px] text-subtle" title={`${t('phase.badge')} ${item.phase}`}>
                          F{item.phase}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-border py-3', collapsed ? 'px-3' : 'px-4')}>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
          aria-expanded={!collapsed}
          className={cn(
            'flex h-10 w-full items-center gap-3 rounded-md text-[13px] text-muted hover:bg-surface-alt hover:text-text',
            collapsed ? 'justify-center' : 'px-2.5',
          )}
        >
          <Icon name="sidebar" size={20} />
          {collapsed ? null : t('nav.collapse')}
        </button>
      </div>
    </aside>
  );
}
