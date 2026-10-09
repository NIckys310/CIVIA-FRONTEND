import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from './cn';
import { Spinner } from './spinner';

type Variant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  // Acción principal: naranja seguridad con texto oscuro (como la señalización de obra).
  primary:
    'bg-accent text-on-accent hover:bg-accent-strong shadow-[inset_0_-1px_0_rgb(0_0_0/0.12)] font-semibold',
  brand: 'bg-brand text-on-brand hover:bg-brand-strong font-medium',
  secondary:
    'bg-surface text-text border border-border hover:border-border-strong hover:bg-surface-alt font-medium',
  ghost: 'text-muted hover:text-text hover:bg-surface-alt font-medium',
  danger: 'bg-surface text-danger border border-border hover:bg-danger-soft hover:border-danger font-medium',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-11 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-civia active:translate-y-px disabled:pointer-events-none disabled:opacity-55',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});
