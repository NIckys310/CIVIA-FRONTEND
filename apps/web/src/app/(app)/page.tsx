'use client';

import type { IconName } from '@civia/ui';
import Link from 'next/link';
import { useState } from 'react';

import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectCard, ProjectCardSkeleton } from '@/components/projects/project-card';
import { Disclaimer, Page } from '@/components/shell/page';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { CotaLabel } from '@/components/ui/cota-label';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Card, SectionTitle, Skeleton } from '@/components/ui/misc';
import { StatusBadge } from '@/components/ui/status-badge';
import { describeActivity, formatRelative } from '@/lib/format';
import { useLocale, useT, type MessageKey } from '@/lib/i18n';
import { useActivity, useProjects } from '@/lib/queries';
import { useSession } from '@/lib/session';

function greetingKey(): MessageKey {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.greeting.morning';
  if (h < 19) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

interface Action {
  key: string;
  icon: IconName;
  title: MessageKey;
  desc: MessageKey;
  href?: string;
  primary?: boolean;
  axis: string;
}

const ACTIONS: Action[] = [
  { key: 'analyze', icon: 'analyze', title: 'dashboard.action.analyze', desc: 'dashboard.action.analyze.desc', href: '/analyze', primary: true, axis: 'A' },
  { key: 'measure', icon: 'measure', title: 'dashboard.action.measure', desc: 'dashboard.action.measure.desc', href: '/measure', axis: 'B' },
  { key: 'create', icon: 'plus', title: 'dashboard.action.create', desc: 'dashboard.action.create.desc', axis: 'C' },
  { key: 'model', icon: 'model3d', title: 'dashboard.action.model', desc: 'dashboard.action.model.desc', href: '/model-3d', axis: 'D' },
];

function ActionTile({ action, onCreate }: { action: Action; onCreate(): void }) {
  const t = useT();
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            action.primary ? 'bg-accent text-on-accent' : 'bg-brand-soft text-brand',
          )}
        >
          <Icon name={action.icon} size={24} />
        </span>
        <span className="font-data flex h-6 w-6 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-subtle">
          {action.axis}
        </span>
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-[16px] font-semibold">
          {t(action.title)}
          <Icon name="arrowRight" size={16} className="-translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
        <span className="text-[13px] leading-snug text-muted">{t(action.desc)}</span>
      </div>
    </>
  );
  const className =
    'group flex min-h-[148px] flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:min-h-[168px] sm:gap-6 sm:p-5 text-left transition-[border-color,box-shadow,transform] duration-200 ease-civia hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_12px_32px_-16px_rgb(0_0_0/0.25)]';
  return action.href ? (
    <Link href={action.href} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onCreate} className={className}>
      {body}
    </button>
  );
}

function ReviewSummary() {
  const t = useT();
  const counts = { danger: 0, warn: 0, ok: 0 };
  const total = counts.danger + counts.warn + counts.ok;
  return (
    <Card className="p-5">
      <SectionTitle>{t('dashboard.reviews')}</SectionTitle>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status="danger" count={counts.danger} />
        <StatusBadge status="warn" count={counts.warn} />
        <StatusBadge status="ok" count={counts.ok} />
      </div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-surface-alt" aria-hidden="true">
        {total > 0 ? (
          <>
            <span className="bg-danger" style={{ width: `${(counts.danger / total) * 100}%` }} />
            <span className="bg-warn" style={{ width: `${(counts.warn / total) * 100}%` }} />
            <span className="bg-ok" style={{ width: `${(counts.ok / total) * 100}%` }} />
          </>
        ) : null}
      </div>
      {total === 0 ? <p className="mt-4 text-[13px] text-muted">{t('dashboard.reviews.empty')}</p> : null}
    </Card>
  );
}

function NormCard() {
  const t = useT();
  return (
    <Card className="p-5">
      <SectionTitle>{t('dashboard.norm')}</SectionTitle>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-alt text-brand">
          <Icon name="library" size={22} />
        </span>
        <div>
          <p className="font-data text-[15px] font-semibold">NSR-10</p>
          <p className="text-[13px] text-muted">Colombia · Decreto 926 de 2010</p>
        </div>
      </div>
      <CotaLabel className="mt-4">Títulos A–I</CotaLabel>
    </Card>
  );
}

function ActivityFeed() {
  const t = useT();
  const locale = useLocale();
  const { data, isLoading, isError, refetch } = useActivity();
  return (
    <Card className="p-5">
      <SectionTitle>{t('dashboard.activity')}</SectionTitle>
      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          {t('common.error')}
          <Button size="sm" variant="ghost" onClick={() => void refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : !data || data.length === 0 ? (
        <p className="mt-4 text-[13px] text-muted">{t('dashboard.activity.empty')}</p>
      ) : (
        <ol className="relative mt-4 flex flex-col gap-4 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-border">
          {data.map((a) => (
            <li key={a.seq} className="relative flex gap-3 pl-5">
              <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-surface bg-brand" aria-hidden="true" />
              <div className="min-w-0 text-[13px]">
                <p className="text-text">
                  <span className="font-medium">{a.actor_name ?? '—'}</span>{' '}
                  <span className="text-muted">{describeActivity(a.action, locale)}</span>
                </p>
                <p className="text-[12px] text-subtle">{formatRelative(a.occurred_at, locale)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const t = useT();
  const locale = useLocale();
  const me = useSession((s) => s.me);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const firstName = me?.user.full_name.split(' ')[0] ?? '';

  return (
    <Page>
      <section className="animate-in mb-8 flex flex-col gap-1.5">
        <p className="label-tech text-brand">
          {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        </p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
          {t(greetingKey())}, {firstName}.
        </h1>
        <p className="text-[15px] text-muted">{t('dashboard.subtitle')}</p>
      </section>

      <section aria-label="Acciones principales" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {ACTIONS.map((a) => (
          <ActionTile key={a.key} action={a} onCreate={() => setCreateOpen(true)} />
        ))}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="recent-title" className="min-w-0">
          <SectionTitle
            action={
              <Link href="/projects" className="flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                {t('dashboard.viewAll')}
                <Icon name="chevronRight" size={16} />
              </Link>
            }
          >
            <span id="recent-title">{t('dashboard.recent')}</span>
          </SectionTitle>
          <div className="mt-4">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <Card className="flex items-center justify-between p-5 text-sm text-muted">
                {t('common.error')}
                <Button size="sm" onClick={() => void refetch()}>
                  {t('common.retry')}
                </Button>
              </Card>
            ) : projects && projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {projects.slice(0, 6).map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <Card className="bg-blueprint">
                <EmptyState
                  icon="projects"
                  title={t('projects.empty.title')}
                  description={t('projects.empty.desc')}
                  action={
                    <Button variant="primary" onClick={() => setCreateOpen(true)}>
                      <Icon name="plus" size={18} />
                      {t('projects.create')}
                    </Button>
                  }
                />
              </Card>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <ReviewSummary />
          <NormCard />
          <ActivityFeed />
        </aside>
      </div>

      <Disclaimer text={t('app.disclaimer')} />
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </Page>
  );
}
