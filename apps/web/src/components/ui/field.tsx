'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

import { cn } from './cn';
import { Icon } from './icon';

const control =
  'w-full rounded-md border bg-surface px-3.5 text-[15px] text-text placeholder:text-subtle transition-[border-color,box-shadow] duration-150 ease-civia outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--c-brand-soft)] disabled:opacity-60';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode;
  trailing?: ReactNode;
}

function FieldShell({ label, hint, error, children, trailing }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-text">
          {label}
        </label>
        {trailing}
      </div>
      {children({ id, describedBy })}
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-[13px] text-danger">
          <Icon name="statusWarn" size={14} />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, trailing, className, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} trailing={trailing}>
      {({ id, describedBy }) => (
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, 'h-12', error ? 'border-danger' : 'border-border', className)}
          {...props}
        />
      )}
    </FieldShell>
  );
});

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type'> {
  showLabel: string;
  hideLabel: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, hint, error, showLabel, hideLabel, className, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(control, 'h-12 pr-12', error ? 'border-danger' : 'border-border', className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? hideLabel : showLabel}
            aria-pressed={visible}
            className="absolute inset-y-0 right-1 my-1 flex w-10 items-center justify-center rounded-md text-muted hover:bg-surface-alt hover:text-text"
          >
            <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
          </button>
        </div>
      )}
    </FieldShell>
  );
});

export interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, hint, error, className, ...props },
  ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <textarea
          ref={ref}
          id={id}
          rows={3}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, 'resize-none py-3', error ? 'border-danger' : 'border-border', className)}
          {...props}
        />
      )}
    </FieldShell>
  );
});
