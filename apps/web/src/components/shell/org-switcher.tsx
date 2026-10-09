'use client';

import { roleLabels } from '@civia/shared-types';
import * as Menu from '@radix-ui/react-dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';

import { civia } from '@/lib/api';
import { useLocale, useT } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs';
import { useSession } from '@/lib/session';

import { cn } from '../ui/cn';
import { Icon } from '../ui/icon';

export function OrgSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const t = useT();
  const locale = useLocale();
  const qc = useQueryClient();
  const me = useSession((s) => s.me);
  const orgId = usePrefs((s) => s.organizationId);
  const setOrganization = usePrefs((s) => s.setOrganization);
  const current = me?.memberships.find((m) => m.organization_id === orgId);
  if (!me || !current) return null;

  const choose = (id: string) => {
    setOrganization(id);
    civia.setOrganization(id);
    void qc.invalidateQueries();
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t('common.switchOrg')}
        className={cn(
          'flex w-full items-center gap-3 rounded-md border border-border bg-surface text-left transition-colors hover:border-border-strong',
          collapsed ? 'h-11 justify-center' : 'h-14 px-3',
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-alt text-brand">
          <Icon name="organization" size={18} />
        </span>
        {collapsed ? null : (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-semibold">{current.organization_name}</span>
              <span className="truncate text-[12px] text-muted">
                {roleLabels[current.role][locale === 'en' ? 'en' : 'es']}
              </span>
            </span>
            <Icon name="chevronDown" size={16} className="text-subtle" />
          </>
        )}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="start"
          sideOffset={6}
          className="animate-in z-50 min-w-[260px] rounded-lg border border-border bg-surface p-1.5 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.25)]"
        >
          <Menu.Label className="label-tech px-2.5 py-2 text-subtle">{t('profile.organizations')}</Menu.Label>
          {me.memberships.map((m) => (
            <Menu.Item
              key={m.organization_id}
              onSelect={() => choose(m.organization_id)}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-surface-alt"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{m.organization_name}</span>
                <span className="font-data text-[11px] text-muted">
                  {m.country_code} · {roleLabels[m.role][locale === 'en' ? 'en' : 'es']}
                </span>
              </span>
              {m.organization_id === orgId ? <Icon name="statusOk" size={16} className="text-brand" /> : null}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
