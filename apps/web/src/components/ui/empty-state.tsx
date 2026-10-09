import type { IconName } from '@civia/ui';
import type { ReactNode } from 'react';

import { cn } from './cn';
import { Icon } from './icon';

/** Estado vacío ilustrado con trazos de plano: un símbolo dentro de un marco acotado. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'gap-3 py-8' : 'gap-4 py-14', className)}>
      <div className="relative">
        <svg width={compact ? 88 : 112} height={compact ? 88 : 112} viewBox="0 0 112 112" aria-hidden="true" className="text-border-strong">
          <rect x="16" y="16" width="80" height="80" rx="4" fill="var(--c-surface-alt)" stroke="currentColor" strokeDasharray="4 3" />
          <path d="M16 6v6M96 6v6M16 9h80" stroke="currentColor" />
          <path d="M16 9l5-2.5M16 9l5 2.5M96 9l-5-2.5M96 9l-5 2.5" stroke="currentColor" />
          <path d="M106 16h-6M106 96h-6M103 16v80" stroke="currentColor" />
          <path d="M103 16l-2.5 5M103 16l2.5 5M103 96l-2.5-5M103 96l2.5-5" stroke="currentColor" />
          <circle cx="16" cy="16" r="2.5" fill="var(--c-accent)" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center pr-1 text-brand">
          <Icon name={icon} size={compact ? 30 : 38} strokeWidth={1.25} />
        </span>
      </div>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-base font-semibold text-text">{title}</h3>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
