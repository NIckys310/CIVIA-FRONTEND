import type { ReactNode } from 'react';

import { cn } from '../ui/cn';

/** Contenedor de página: ocupa todo el ancho disponible con márgenes fluidos. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full px-4 py-6 sm:px-6 lg:px-10 lg:py-8 2xl:px-14', className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow ? <div className="label-tech text-brand">{eyebrow}</div> : null}
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] sm:text-[30px]">{title}</h1>
        {description ? <p className="text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="mt-10 flex items-center gap-2 border-t border-border pt-4 text-[12px] text-subtle">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      {text}
    </p>
  );
}
