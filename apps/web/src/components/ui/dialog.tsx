'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { Icon } from './icon';

/**
 * Diálogo accesible (foco atrapado, Escape, aria). En móvil se presenta como hoja inferior
 * a pantalla completa de ancho; en escritorio, centrado.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="animate-in fixed inset-0 z-40 bg-[rgb(10_17_29/0.45)] backdrop-blur-[2px]" />
        <RadixDialog.Content
          className="animate-in fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-xl border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_24px_64px_-16px_rgb(0_0_0/0.35)] outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(560px,calc(100vw-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:pb-0"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-1">
              <RadixDialog.Title className="text-lg font-semibold tracking-[-0.01em]">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="text-sm text-muted">{description}</RadixDialog.Description>
              ) : null}
            </div>
            <RadixDialog.Close
              aria-label={closeLabel}
              className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-alt hover:text-text"
            >
              <Icon name="close" size={18} />
            </RadixDialog.Close>
          </header>
          <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
