import { cn } from '../ui/cn';

/**
 * Marca de CIVIA: un pórtico estructural (columna + dos vigas en voladizo) que forma una "C",
 * con un nodo de eje en el extremo. Se lee como letra y como estructura a la vez.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="var(--c-brand)" />
      <g stroke="var(--c-on-brand)" strokeWidth="2.4" strokeLinecap="square" fill="none">
        <path d="M23 9H10v14h13" />
        <path d="M14 9v14" strokeWidth="1.2" opacity="0.55" />
      </g>
      <circle cx="23" cy="23" r="2.6" fill="var(--c-accent)" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {compact ? null : (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-text">CIVIA</span>
          <span className="label-tech text-brand">AI</span>
        </span>
      )}
    </span>
  );
}
