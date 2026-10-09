'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectCard, ProjectCardSkeleton } from '@/components/projects/project-card';
import { Page, PageHeader } from '@/components/shell/page';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Card } from '@/components/ui/misc';
import { useT } from '@/lib/i18n';
import { useProjects } from '@/lib/queries';

function ProjectsView() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState('');
  const createOpen = params.get('new') === '1';
  const setCreateOpen = (open: boolean) => router.replace(open ? '/projects?new=1' : '/projects');
  const { data, isLoading, isError, refetch } = useProjects();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!data || !q) return data ?? [];
    return data.filter((p) => [p.name, p.code, p.location ?? ''].some((v) => v.toLowerCase().includes(q)));
  }, [data, query]);

  return (
    <Page>
      <PageHeader
        eyebrow={data ? `${data.length} · ${t('projects.title')}` : t('projects.title')}
        title={t('projects.title')}
        description={t('projects.subtitle')}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={18} />
            {t('projects.create')}
          </Button>
        }
      />

      {data && data.length > 0 ? (
        <div className="relative mb-6 max-w-xl">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('projects.search')}
            aria-label={t('projects.search')}
            className="h-11 w-full rounded-md border border-border bg-surface pl-11 pr-3.5 text-[15px] outline-none placeholder:text-subtle focus:border-brand focus:shadow-[0_0_0_3px_var(--c-brand-soft)]"
          />
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
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
      ) : !data || data.length === 0 ? (
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
      ) : filtered.length === 0 ? (
        <EmptyState compact icon="search" title={t('projects.noResults')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </Page>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsView />
    </Suspense>
  );
}
