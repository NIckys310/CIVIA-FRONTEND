'use client';

import { useT } from '@/lib/i18n';

import { LogoMark } from './logo';

/** Pantalla de carga: un pórtico que se dibuja sobre papel de plano. */
export function LoadingScreen() {
  const t = useT();
  return (
    <div className="bg-blueprint fixed inset-0 flex flex-col items-center justify-center gap-6" role="status" aria-live="polite">
      <svg width="160" height="96" viewBox="0 0 160 96" aria-hidden="true" fill="none">
        <g stroke="var(--c-brand)" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="8 3 2 3">
          <path d="M20 4v88M80 4v88M140 4v88" />
        </g>
        <g stroke="var(--c-text)" strokeWidth="2.5" strokeLinecap="square">
          <path className="draw" style={{ ['--path-length' as string]: 400 }} d="M20 86V22h120v64" />
          <path className="draw" style={{ ['--path-length' as string]: 80, animationDelay: '0.5s' }} d="M80 22v64" />
        </g>
        <path d="M8 90h144" stroke="var(--c-text-muted)" strokeWidth="1" />
        <circle cx="140" cy="22" r="4" fill="var(--c-accent)" />
      </svg>
      <div className="flex items-center gap-2 text-sm text-muted">
        <LogoMark size={18} />
        <span>{t('app.loading')}</span>
      </div>
    </div>
  );
}
