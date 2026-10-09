'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { civia } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';

import { LogoMark } from '../brand/logo';
import { Icon } from '../ui/icon';
import { Avatar, Kbd } from '../ui/misc';

const iconButton =
  'flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-text';

const menuItem =
  'flex h-10 cursor-pointer items-center gap-3 rounded-md px-2.5 text-sm outline-none data-[highlighted]:bg-surface-alt';

function ThemeToggle() {
  const t = useT();
  const theme = usePrefs((s) => s.theme);
  const setTheme = usePrefs((s) => s.setTheme);
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const icon = theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor';
  return (
    <button
      type="button"
      className={iconButton}
      onClick={() => setTheme(nextTheme)}
      aria-label={`${t('common.toggleTheme')}: ${t(`profile.theme.${theme}`)}`}
      title={t(`profile.theme.${theme}`)}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

function UserMenu() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useSession((s) => s.me);
  const expire = useSession((s) => s.expire);
  if (!me) return null;

  const logout = async () => {
    await civia.auth.logout();
    qc.clear();
    expire();
    router.replace('/login');
  };

  return (
    <Menu.Root>
      <Menu.Trigger aria-label={t('common.userMenu')} className="flex h-10 items-center gap-2 rounded-md pl-1 pr-1.5 hover:bg-surface-alt">
        <Avatar name={me.user.full_name} size={32} />
        <Icon name="chevronDown" size={16} className="hidden text-subtle sm:block" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={6}
          className="animate-in z-50 w-[260px] rounded-lg border border-border bg-surface p-1.5 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.25)]"
        >
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <Avatar name={me.user.full_name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me.user.full_name}</p>
              <p className="truncate text-[12px] text-muted">{me.user.email}</p>
            </div>
          </div>
          <Menu.Separator className="my-1 h-px bg-border" />
          <Menu.Item asChild className={menuItem}>
            <Link href="/profile">
              <Icon name="shield" size={18} className="text-muted" />
              {t('profile.title')}
            </Link>
          </Menu.Item>
          <Menu.Separator className="my-1 h-px bg-border" />
          <Menu.Item onSelect={() => void logout()} className={`${menuItem} text-danger`}>
            <Icon name="logout" size={18} />
            {t('profile.logout')}
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function Topbar({ title, onOpenSearch }: { title?: string; onOpenSearch(): void }) {
  const t = useT();
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-bg/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-md md:px-6">
      <Link href="/" className="md:hidden" aria-label="CIVIA — inicio">
        <LogoMark size={30} />
      </Link>
      {title ? <h1 className="truncate text-[15px] font-semibold md:hidden">{title}</h1> : null}

      <button
        type="button"
        onClick={onOpenSearch}
        className="ml-auto hidden h-10 w-full max-w-[420px] items-center gap-3 rounded-md border border-border bg-surface px-3 text-sm text-subtle transition-colors hover:border-border-strong md:mr-auto md:ml-0 md:flex"
      >
        <Icon name="search" size={18} />
        <span className="flex-1 text-left">{t('nav.search')}</span>
        <span className="flex items-center gap-1">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <button type="button" onClick={onOpenSearch} className={`${iconButton} md:hidden`} aria-label={t('nav.search')}>
          <Icon name="search" size={20} />
        </button>
        <ThemeToggle />
        <button type="button" className={`${iconButton} hidden sm:flex`} aria-label={t('common.notifications')} title={t('common.noNotifications')}>
          <Icon name="bell" size={20} />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
