import type { ReactNode } from 'react';

import { cn } from './cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden="true" />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="font-data inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface px-1 text-[11px] text-muted">
      {children}
    </kbd>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials || '·'}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn('rounded-lg border border-border bg-surface', className)}>{children}</section>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="label-tech text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function PhaseBadge({ phase, label }: { phase: number; label: string }) {
  return (
    <span className="label-tech inline-flex h-6 items-center gap-1.5 rounded-sm border border-dashed border-border-strong px-2 text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {label} {phase}
    </span>
  );
}
