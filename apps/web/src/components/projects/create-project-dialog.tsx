'use client';

import { ApiError } from '@civia/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useT } from '@/lib/i18n';
import { useCreateProject } from '@/lib/queries';

import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { TextAreaField, TextField } from '../ui/field';
import { Icon } from '../ui/icon';

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const t = useT();
  const router = useRouter();
  const create = useCreateProject();

  const schema = z.object({
    name: z.string().trim().min(2, t('projects.form.nameRequired')).max(200),
    location: z.string().trim().max(200).optional(),
    description: z.string().trim().max(4000).optional(),
  });
  type Values = z.infer<typeof schema>;
  const { register, handleSubmit, formState, reset } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    let project;
    try {
      project = await create.mutateAsync({
        name: values.name,
        location: values.location || null,
        description: values.description || null,
      });
    } catch {
      return; // el error se muestra desde create.error
    }
    reset();
    onOpenChange(false);
    router.push(`/projects/${project.id}`);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) create.reset();
        onOpenChange(o);
      }}
      title={t('projects.create')}
      description={t('dashboard.action.create.desc')}
      closeLabel={t('common.close')}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {create.error ? (
          <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3.5 py-3 text-sm text-danger">
            <Icon name="statusDanger" size={18} className="mt-px shrink-0" />
            {create.error instanceof ApiError ? create.error.message : t('common.error')}
          </div>
        ) : null}
        <TextField
          label={t('projects.form.name')}
          placeholder={t('projects.form.namePlaceholder')}
          autoFocus
          error={formState.errors.name?.message}
          {...register('name')}
        />
        <TextField
          label={t('projects.form.location')}
          placeholder={t('projects.form.locationPlaceholder')}
          error={formState.errors.location?.message}
          {...register('location')}
        />
        <TextAreaField
          label={t('projects.form.description')}
          placeholder={t('projects.form.descriptionPlaceholder')}
          error={formState.errors.description?.message}
          {...register('description')}
        />
        <div className="flex items-start gap-2.5 rounded-md border border-dashed border-border-strong bg-surface-alt px-3.5 py-3 text-[13px] text-muted">
          <Icon name="library" size={18} className="mt-px shrink-0 text-brand" />
          {t('projects.form.norm')}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('projects.form.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={formState.isSubmitting}>
            <Icon name="plus" size={18} />
            {t('projects.form.submit')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
