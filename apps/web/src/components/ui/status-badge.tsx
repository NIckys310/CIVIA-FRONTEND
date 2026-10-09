'use client';

import { statusMeta, type Status } from '@civia/ui';

import { useT } from '@/lib/i18n';

import { cn } from './cn';
import { Icon } from './icon';

const tone: Record<Status, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

/** Semáforo de revisión: icono + texto + color (el estado nunca depende solo del color). */
export function StatusBadge({ status, count, className }: { status: Status; count?: number; className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full pl-1.5 pr-2.5 text-[13px] font-medium',
        tone[status],
        className,
      )}
    >
      <Icon name={statusMeta[status].icon} size={16} />
      <span>{t(`status.${status}`)}</span>
      {count !== undefined ? <span className="font-data font-semibold">{count}</span> : null}
    </span>
  );
}
