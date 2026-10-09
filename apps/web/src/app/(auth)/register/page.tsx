'use client';

import { ApiError } from '@civia/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PasswordField, TextField } from '@/components/ui/field';
import { civia } from '@/lib/api';
import { useT } from '@/lib/i18n';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = z.object({
    full_name: z.string().trim().min(2, t('auth.error.required')),
    organization_name: z.string().trim().min(2, t('auth.error.required')),
    email: z.email(t('auth.error.email')),
    password: z.string().min(12, t('auth.error.passwordLength')).max(128),
  });
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await civia.auth.register(values);
      router.push('/login?registered=1');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : t('common.error'));
    }
  });

  return (
    <div className="animate-in flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="label-tech text-brand">{t('app.name')} · Registro</span>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{t('auth.register.title')}</h1>
        <p className="text-muted">{t('auth.register.subtitle')}</p>
      </header>

      {formError ? (
        <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <Icon name="statusDanger" size={18} className="mt-px shrink-0" />
          {formError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label={t('auth.field.fullName')}
            autoComplete="name"
            error={formState.errors.full_name?.message}
            {...register('full_name')}
          />
          <TextField
            label={t('auth.field.organization')}
            autoComplete="organization"
            error={formState.errors.organization_name?.message}
            {...register('organization_name')}
          />
        </div>
        <TextField
          label={t('auth.field.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={formState.errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label={t('auth.field.password')}
          autoComplete="new-password"
          hint={t('auth.field.passwordHint')}
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          error={formState.errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" variant="primary" size="lg" loading={formState.isSubmitting} className="mt-1 w-full">
          {t('auth.register.submit')}
          <Icon name="arrowRight" size={18} />
        </Button>
      </form>

      <p className="text-sm text-muted">
        {t('auth.register.hasAccount')}{' '}
        <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">
          {t('auth.login.submit')}
        </Link>
      </p>
    </div>
  );
}
