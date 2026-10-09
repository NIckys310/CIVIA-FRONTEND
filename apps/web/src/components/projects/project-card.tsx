'use client';

import type { Project } from '@civia/shared-types';
import Link from 'next/link';

import { formatRelative } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

import { PlanThumbnail } from '../brand/plan-thumbnail';
import { Icon } from '../ui/icon';

export function ProjectCard({ project }: { project: Project }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-[border-color,box-shadow,transform] duration-200 ease-civia hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_12px_32px_-16px_rgb(0_0_0/0.25)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-border">
        <PlanThumbnail id={project.id} className="h-full w-full transition-transform duration-300 ease-civia group-hover:scale-[1.03]" />
        <span className="font-data absolute left-3 top-3 rounded-sm bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold text-brand backdrop-blur-sm">
          {project.code}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">{project.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
            <Icon name="mapPin" size={14} className="shrink-0" />
            {project.location || '—'}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 text-[12px]">
          <span className="font-data rounded-sm bg-surface-alt px-1.5 py-0.5 text-muted">
            {project.norm_code} · {project.norm_version}
          </span>
          <span className="text-subtle">
            {t('projects.updated')} {formatRelative(project.updated_at, locale)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="skeleton aspect-[16/9]" />
      <div className="flex flex-col gap-2 p-4">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton mt-3 h-3 w-full rounded" />
      </div>
    </div>
  );
}
