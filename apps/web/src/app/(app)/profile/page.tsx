'use client';

import { roleLabels } from '@civia/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { Page, PageHeader } from '@/components/shell/page';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { Icon } from '@/components/ui/icon';
import { Avatar, Card, SectionTitle, Skeleton } from '@/components/ui/misc';
import { civia } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import { useLocale, useT, type Locale } from '@/lib/i18n';
import { usePrefs, type ThemePref } from '@/lib/prefs';
import { useRevokeSession, useSessions } from '@/lib/queries';
import { useSession } from '@/lib/session';

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange(v: T): void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-border bg-surface-alt p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'h-9 rounded px-3.5 text-[13px] font-medium transition-colors',
            o.value === value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SessionsCard() {
  const t = useT();
  const locale = useLocale();
  const { data, isLoading } = useSessions();
  const revoke = useRevokeSession();
  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle>{t('profile.sessions')}</SectionTitle>
      <p className="mt-2 text-sm text-muted">{t('profile.sessions.desc')}</p>
      <ul className="mt-5 flex flex-col divide-y divide-border">
        {isLoading
          ? [0, 1].map((i) => <Skeleton key={i} className="my-2 h-14" />)
          : data?.map((s) => (
              <li key={s.id} className="flex items-center gap-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-muted">
                  <Icon name={/mobile|android|iphone|civia móvil/i.test(s.device_label ?? '') ? 'device' : 'monitor'} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {s.device_label || t('common.unknownDevice')}
                    {s.current ? (
                      <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok">
                        {t('profile.sessions.current')}
                      </span>
                    ) : null}
                  </p>
                  <p className="font-data truncate text-[12px] text-subtle">
                    {s.ip_address ?? '—'} · {t('profile.sessions.lastSeen')} {formatRelative(s.last_seen_at, locale)}
                  </p>
                </div>
                {s.current ? null : (
                  <Button
                    size="sm"
                    variant="danger"
                    loading={revoke.isPending && revoke.variables === s.id}
                    onClick={() => revoke.mutate(s.id)}
                  >
                    {t('profile.sessions.revoke')}
                  </Button>
                )}
              </li>
            ))}
      </ul>
    </Card>
  );
}

export default function ProfilePage() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useSession((s) => s.me);
  const expire = useSession((s) => s.expire);
  const { locale, theme, setLocale, setTheme } = usePrefs();
  if (!me) return null;

  const logout = async () => {
    await civia.auth.logout();
    qc.clear();
    expire();
    router.replace('/login');
  };

  return (
    <Page>
      <PageHeader eyebrow={t('nav.profile')} title={t('profile.title')} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar name={me.user.full_name} size={56} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{me.user.full_name}</p>
                <p className="truncate text-sm text-muted">{me.user.email}</p>
              </div>
            </div>
            <div className="mt-6">
              <SectionTitle>{t('profile.organizations')}</SectionTitle>
              <ul className="mt-3 flex flex-col gap-2">
                {me.memberships.map((m) => (
                  <li key={m.organization_id} className="flex items-center justify-between gap-3 rounded-md bg-surface-alt px-3.5 py-2.5 text-sm">
                    <span className="flex items-center gap-2 truncate font-medium">
                      <Icon name="organization" size={16} className="text-brand" />
                      {m.organization_name}
                    </span>
                    <span className="text-[12px] text-muted">{roleLabels[m.role][locale === 'en' ? 'en' : 'es']}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionTitle>{t('profile.preferences')}</SectionTitle>
            <div className="mt-5 flex flex-col gap-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium">{t('profile.language')}</span>
                <Segmented<Locale>
                  label={t('profile.language')}
                  value={locale}
                  onChange={setLocale}
                  options={[
                    { value: 'es-CO', label: 'Español (CO)' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium">{t('profile.theme')}</span>
                <Segmented<ThemePref>
                  label={t('profile.theme')}
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: 'system', label: t('profile.theme.system') },
                    { value: 'light', label: t('profile.theme.light') },
                    { value: 'dark', label: t('profile.theme.dark') },
                  ]}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <SessionsCard />
          <Button variant="danger" size="lg" onClick={() => void logout()} className="w-full sm:w-auto sm:self-start">
            <Icon name="logout" size={18} />
            {t('profile.logout')}
          </Button>
        </div>
      </div>
    </Page>
  );
}
