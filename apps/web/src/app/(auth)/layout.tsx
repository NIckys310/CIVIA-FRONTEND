'use client';

import type { ReactNode } from 'react';

import { BlueprintScene } from '@/components/brand/blueprint-scene';
import { Logo } from '@/components/brand/logo';
import { Icon } from '@/components/ui/icon';
import { useT } from '@/lib/i18n';

/** Principio rector, presentado como el cajetín (rótulo) de un plano. */
function TitleBlock() {
  const rows: Array<[string, string]> = [
    ['IA', 'Interpreta'],
    ['Motor', 'Calcula'],
    ['Normativa', 'Establece criterios'],
    ['Ingeniero', 'Valida'],
  ];
  return (
    <div className="w-full max-w-[360px] border border-border-strong bg-surface/90 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border-strong px-4 py-2.5">
        <span className="label-tech text-muted">Principio rector</span>
        <span className="font-data text-[11px] text-subtle">HOJA 1/1</span>
      </div>
      <dl className="grid grid-cols-[110px_1fr]">
        {rows.map(([k, v], i) => (
          <div key={k} className={`contents ${i < rows.length - 1 ? '[&>*]:border-b' : ''} [&>*]:border-border`}>
            <dt className="label-tech border-r border-border px-4 py-2.5 text-brand">{k}</dt>
            <dd className="px-4 py-2.5 text-sm text-text">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(480px,0.9fr)]">
      {/* Panel de plano (escritorio) */}
      <aside className="bg-blueprint sticky top-0 hidden h-dvh overflow-hidden border-r border-border lg:flex lg:flex-col">
        <div className="relative z-10 flex shrink-0 items-center justify-between px-10 pt-8">
          <Logo />
          <span className="label-tech text-muted">es-CO · NSR-10</span>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-10 py-6">
          <BlueprintScene className="h-full max-h-[620px] w-full max-w-[640px]" />
        </div>
        <div className="relative z-10 flex shrink-0 flex-col gap-6 px-10 pb-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-sm">
            <p className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-text">
              {t('app.tagline')}.
            </p>
            <p className="mt-3 text-sm text-muted">{t('app.disclaimer')}</p>
          </div>
          <TitleBlock />
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex min-h-dvh flex-col bg-bg">
        <div className="bg-blueprint relative h-40 overflow-hidden border-b border-border lg:hidden">
          <BlueprintScene className="absolute -right-24 -top-16 h-[340px] w-[340px] opacity-80" />
          <div className="absolute left-4 top-[max(env(safe-area-inset-top),16px)]">
            <Logo />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <footer className="flex items-center justify-center gap-2 px-4 pb-[max(env(safe-area-inset-bottom),20px)] text-[12px] text-subtle">
          <Icon name="lock" size={14} />
          <span>{t('auth.secureNote')}</span>
        </footer>
      </main>
    </div>
  );
}
