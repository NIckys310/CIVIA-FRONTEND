import type { Locale } from './i18n';

export function formatRelative(iso: string, locale: Locale): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

const ACTIVITY_ES: Record<string, string> = {
  'project.created': 'creó el proyecto',
  'auth.register': 'creó la organización',
};
const ACTIVITY_EN: Record<string, string> = {
  'project.created': 'created the project',
  'auth.register': 'created the organization',
};

export function describeActivity(action: string, locale: Locale): string {
  return (locale === 'en' ? ACTIVITY_EN : ACTIVITY_ES)[action] ?? action;
}
