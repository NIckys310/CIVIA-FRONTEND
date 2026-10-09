'use client';

import type { IconName } from '@civia/ui';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { PlanThumbnail } from '@/components/brand/plan-thumbnail';
import { Disclaimer, Page } from '@/components/shell/page';
import { cn } from '@/components/ui/cn';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { Card, PhaseBadge, Skeleton } from '@/components/ui/misc';
import { formatDateTime } from '@/lib/format';
import { useLocale, useT, type MessageKey } from '@/lib/i18n';
import { useProject } from '@/lib/queries';

interface Folder {
  key: string;
  label: MessageKey;
  icon: IconName;
  phase: number;
  hint: string;
}

/** Carpetas de obra (§8.2). `phase` = fase del roadmap en que se habilita cada una. */
const FOLDERS: Folder[] = [
  { key: 'plans', label: 'folder.plans', icon: 'plan', phase: 1, hint: 'PDF, imagen o DXF. La IA detectará columnas, vigas, zapatas, ejes y cotas.' },
  { key: 'calculations', label: 'folder.calculations', icon: 'calc', phase: 2, hint: 'Cargas, combinaciones y verificaciones del motor determinista civia-engine.' },
  { key: 'foundation', label: 'folder.foundation', icon: 'footing', phase: 2, hint: 'Zapatas, pilotes y verificación de capacidad portante.' },
  { key: 'soil', label: 'folder.soil', icon: 'soil', phase: 2, hint: 'SPT, capacidad portante, nivel freático y estabilidad de taludes.' },
  { key: 'measurements', label: 'folder.measurements', icon: 'measure', phase: 4, hint: 'Mediciones de CIVIA Measure con nivel de confianza y evidencia.' },
  { key: 'observations', label: 'folder.observations', icon: 'observation', phase: 1, hint: 'Hallazgos de revisión con enlace al área exacta del plano.' },
  { key: 'models', label: 'folder.models', icon: 'model3d', phase: 3, hint: 'Modelo estructural 3D generado desde los planos o desde IFC.' },
  { key: 'reports', label: 'folder.reports', icon: 'report', phase: 1, hint: 'Informes de revisión en PDF/DOCX con firma del profesional responsable.' },
  { key: 'versions', label: 'folder.versions', icon: 'versions', phase: 1, hint: 'Historial v01 → v02 → v03 y qué cambió entre versiones.' },
];

function ProjectView() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const active = FOLDERS.find((f) => f.key === params.get('tab')) ?? FOLDERS[0]!;
  const { data: project, isLoading, isError } = useProject(id);

  if (isLoading) {
    return (
      <Page>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="mb-8 h-9 w-2/3 max-w-lg" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="mt-6 h-72 w-full" />
      </Page>
    );
  }

  if (isError || !project) {
    return (
      <Page>
        <EmptyState
          icon="statusWarn"
          title={t('projects.notFound')}
          action={
            <Link href="/projects" className="text-sm font-medium text-brand hover:underline">
              {t('projects.back')}
            </Link>
          }
        />
      </Page>
    );
  }

  return (
    <Page className="pt-0 sm:pt-0 lg:pt-0">
      {/* Cabecera con franja de plano */}
      <div className="relative -mx-4 mb-6 overflow-hidden border-b border-border sm:-mx-6 lg:-mx-10 2xl:-mx-14">
        <PlanThumbnail id={project.id} className="absolute inset-0 h-full w-full opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/90 to-bg/40" />
        <div className="relative px-4 py-6 sm:px-6 lg:px-10 lg:py-8 2xl:px-14">
          <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted hover:text-text">
            <Icon name="chevronRight" size={14} className="rotate-180" />
            {t('projects.back')}
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="font-data text-[13px] font-semibold text-brand">{project.code}</p>
              <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">{project.name}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <Icon name="mapPin" size={15} />
                  {project.location || '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="library" size={15} />
                  <span className="font-data">{project.norm_code} · {project.norm_version}</span>
                </span>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border text-[12px] sm:grid-cols-3">
              {[
                ['Estado', project.status === 'active' ? 'Activo' : project.status],
                ['Creado', formatDateTime(project.created_at, locale)],
                ['Planos', '0'],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface px-3 py-2">
                  <dt className="label-tech text-subtle">{k}</dt>
                  <dd className="font-data mt-0.5 text-text">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pestañas de carpeta de obra */}
      <div role="tablist" aria-label="Carpetas del proyecto" className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {FOLDERS.map((f) => {
          const selected = f.key === active.key;
          return (
            <button
              key={f.key}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${f.key}`}
              onClick={() => router.replace(`/projects/${id}?tab=${f.key}`, { scroll: false })}
              className={cn(
                'relative flex h-12 shrink-0 items-center gap-2 px-3 text-sm transition-colors',
                selected ? 'font-semibold text-text' : 'text-muted hover:text-text',
              )}
            >
              <Icon name={f.icon} size={18} className={selected ? 'text-brand' : undefined} />
              {t(f.label)}
              {selected ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>

      <div id={`panel-${active.key}`} role="tabpanel" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-blueprint">
          <EmptyState
            icon={active.icon}
            title={`${t(active.label)} — ${t('folder.empty')}`}
            description={active.hint}
            action={<PhaseBadge phase={active.phase} label={t('phase.badge')} />}
          />
        </Card>
        <Card className="p-5">
          <h2 className="label-tech text-muted">Ficha del proyecto</h2>
          <dl className="mt-4 flex flex-col divide-y divide-border text-sm">
            {[
              ['Código', project.code],
              ['Normativa', `${project.norm_code} (${project.norm_version})`],
              ['País', 'Colombia'],
              ['Actualizado', formatDateTime(project.updated_at, locale)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="font-data text-right text-[13px]">{v}</dd>
              </div>
            ))}
          </dl>
          {project.description ? <p className="mt-4 text-sm text-muted">{project.description}</p> : null}
        </Card>
      </div>

      <Disclaimer text={t('app.disclaimer')} />
    </Page>
  );
}

export default function ProjectPage() {
  return (
    <Suspense>
      <ProjectView />
    </Suspense>
  );
}
