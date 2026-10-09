'use client';

import { ApiError } from '@civia/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { LoadingScreen } from '@/components/brand/loading-screen';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PasswordField, TextField } from '@/components/ui/field';
import { civia } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { loadMe, useSessionBootstrap } from '@/lib/use-session-bootstrap';

/** Solo se permiten redirecciones internas (evita open redirect). */
function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const status = useSession((s) => s.status);
  const [formError, setFormError] = useState<string | null>(null);
  useSessionBootstrap();

  const schema = z.object({
    email: z.email(t('auth.error.email')),
    password: z.string().min(1, t('auth.error.password')),
  });
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, next, router]);

  if (status !== 'anonymous') return <LoadingScreen />;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await civia.auth.login({ ...values, device_label: `Web · ${navigator.platform || 'navegador'}` });
      await loadMe();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : t('common.error'));
    }
  });

  const registered = params.get('registered') === '1';

  return (
    <div className="animate-in flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="label-tech text-brand">{t('app.name')} · Login</span>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{t('auth.login.title')}</h1>
        <p className="text-muted">{t('auth.login.subtitle')}</p>
      </header>

      {registered ? (
        <div role="status" className="flex items-center gap-2 rounded-md bg-ok-soft px-3.5 py-3 text-sm text-ok">
          <Icon name="statusOk" size={18} />
          {t('auth.register.success')}
        </div>
      ) : null}
      {formError ? (
        <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <Icon name="statusDanger" size={18} className="mt-px shrink-0" />
          {formError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <TextField
          label={t('auth.field.email')}
          type="email"
          autoComplete="username"
          inputMode="email"
          autoFocus
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label={t('auth.field.password')}
          autoComplete="current-password"
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          error={formState.errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" variant="primary" size="lg" loading={formState.isSubmitting} className="mt-1 w-full">
          {t('auth.login.submit')}
          <Icon name="arrowRight" size={18} />
        </Button>
      </form>

      <p className="text-sm text-muted">
        {t('auth.login.noAccount')}{' '}
        <Link href="/register" className="font-medium text-brand underline-offset-4 hover:underline">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <LoginForm />
    </Suspense>
  );
}
