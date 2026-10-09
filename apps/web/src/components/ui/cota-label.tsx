import { cn } from './cn';

/**
 * Línea de cota de dibujo técnico: |◄──── valor ────►|
 * Se usa como separador con medida o para destacar una dimensión.
 */
export function CotaLabel({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-subtle', className)} aria-hidden={children ? undefined : true}>
      <span className="h-3 w-px bg-current" />
      <svg className="h-2 flex-1" preserveAspectRatio="none" viewBox="0 0 100 8" aria-hidden="true">
        <path d="M0 4h100M0 4l5-3M0 4l5 3M100 4l-5-3M100 4l-5 3" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
      </svg>
      {children ? <span className="font-data text-[12px] text-muted">{children}</span> : null}
      {children ? (
        <svg className="h-2 flex-1" preserveAspectRatio="none" viewBox="0 0 100 8" aria-hidden="true">
          <path d="M0 4h100M100 4l-5-3M100 4l-5 3" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
        </svg>
      ) : null}
      <span className="h-3 w-px bg-current" />
    </div>
  );
}
