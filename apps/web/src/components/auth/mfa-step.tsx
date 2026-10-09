'use client';

import { ApiError } from '@civia/api-client';
import { useState, type FormEvent } from 'react';

import { civia } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { loadMe } from '@/lib/use-session-bootstrap';

import { Button } from '../ui/button';
import { TextField } from '../ui/field';
import { Icon } from '../ui/icon';

/** Paso 2 del login: código TOTP (6 dígitos) o código de recuperación de un solo uso. */
export function MfaStep({ mfaToken, onCancel }: { mfaToken: string; onCancel(): void }) {
  const t = useT();
  const [useRecovery, setUseRecovery] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await civia.auth.verifyMfa(
        useRecovery ? { mfaToken, recoveryCode: value } : { mfaToken, code: value },
      );
      await loadMe();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
      setValue('');
    } finally {
      setBusy(false);
    }
  };

  const ready = useRecovery ? value.trim().length >= 10 : /^\d{6}$/.test(value);

  return (
    <div className="animate-in flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon name="shield" size={24} />
        </span>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.02em]">{t('auth.mfa.title')}</h1>
        <p className="text-muted">{useRecovery ? t('auth.mfa.recoverySubtitle') : t('auth.mfa.subtitle')}</p>
      </header>

      {error ? (
        <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <Icon name="statusDanger" size={18} className="mt-px shrink-0" />
          {error}
        </div>
      ) : null}

      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-5" noValidate>
        {useRecovery ? (
          <TextField
            key="recovery"
            label={t('auth.mfa.recoveryCode')}
            placeholder="XXXXX-XXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            className="font-data tracking-[0.15em]"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
          />
        ) : (
          <TextField
            key="totp"
            label={t('auth.mfa.code')}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            className="font-data text-center text-[22px] tracking-[0.5em]"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        )}
        <Button type="submit" variant="primary" size="lg" loading={busy} disabled={!ready} className="w-full">
          {t('auth.mfa.submit')}
          <Icon name="arrowRight" size={18} />
        </Button>
      </form>

      <div className="flex flex-col items-start gap-3 text-sm">
        <button
          type="button"
          className="font-medium text-brand underline-offset-4 hover:underline"
          onClick={() => {
            setUseRecovery((v) => !v);
            setValue('');
            setError(null);
          }}
        >
          {useRecovery ? t('auth.mfa.useApp') : t('auth.mfa.useRecovery')}
        </button>
        <button type="button" className="text-muted hover:text-text" onClick={onCancel}>
          {t('auth.mfa.back')}
        </button>
      </div>
    </div>
  );
}
