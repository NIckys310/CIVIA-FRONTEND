'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useT } from '@/lib/i18n';
import { usePrefs } from '@/lib/prefs';
import { useProjects } from '@/lib/queries';

import { Icon } from '../ui/icon';
import { Kbd } from '../ui/misc';
import { NAV_SECTIONS } from './nav';

const itemClass =
  'flex h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-text outline-none data-[selected=true]:bg-surface-alt';

/** Paleta de comandos global (Ctrl/⌘+K): navegación, proyectos y acciones rápidas. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange(open: boolean): void }) {
  const t = useT();
  const router = useRouter();
  const { data: projects } = useProjects();
  const setTheme = usePrefs((s) => s.setTheme);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="animate-in fixed inset-0 z-40 bg-[rgb(10_17_29/0.45)] backdrop-blur-[2px]" />
        <RadixDialog.Content className="animate-in fixed inset-x-3 top-[12dvh] z-50 mx-auto max-w-[620px] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_24px_64px_-16px_rgb(0_0_0/0.4)] outline-none">
          <RadixDialog.Title className="sr-only">{t('nav.search')}</RadixDialog.Title>
          <Command label={t('nav.search')} className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Icon name="search" size={18} className="text-subtle" />
              <Command.Input
                autoFocus
                placeholder={t('nav.search')}
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-subtle"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="scrollbar-thin max-h-[min(60dvh,420px)] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-8 text-center text-sm text-muted">—</Command.Empty>

              <Command.Group heading={t('nav.section.work')} className="[&_[cmdk-group-heading]]:label-tech [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-subtle">
                <Command.Item onSelect={() => go('/projects?new=1')} className={itemClass}>
                  <Icon name="plus" size={18} className="text-accent" />
                  {t('dashboard.action.create')}
                </Command.Item>
                {NAV_SECTIONS.flatMap((s) => s.items).map((item) => (
                  <Command.Item key={item.href} onSelect={() => go(item.href)} className={itemClass}>
                    <Icon name={item.icon} size={18} className="text-muted" />
                    <span className="flex-1">{t(item.label)}</span>
                    {item.phase ? <span className="font-data text-[11px] text-subtle">F{item.phase}</span> : null}
                  </Command.Item>
                ))}
                <Command.Item onSelect={() => go('/profile')} className={itemClass}>
                  <Icon name="shield" size={18} className="text-muted" />
                  {t('profile.title')}
                </Command.Item>
              </Command.Group>

              {projects && projects.length > 0 ? (
                <Command.Group heading={t('nav.projects')} className="[&_[cmdk-group-heading]]:label-tech [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-subtle">
                  {projects.slice(0, 8).map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`${p.code} ${p.name} ${p.location ?? ''}`}
                      onSelect={() => go(`/projects/${p.id}`)}
                      className={itemClass}
                    >
                      <Icon name="projects" size={18} className="text-muted" />
                      <span className="font-data text-[12px] text-brand">{p.code}</span>
                      <span className="truncate">{p.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              <Command.Group heading={t('profile.theme')} className="[&_[cmdk-group-heading]]:label-tech [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-subtle">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <Command.Item
                    key={theme}
                    onSelect={() => {
                      setTheme(theme);
                      onOpenChange(false);
                    }}
                    className={itemClass}
                  >
                    <Icon name={theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor'} size={18} className="text-muted" />
                    {t(`profile.theme.${theme}`)}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
