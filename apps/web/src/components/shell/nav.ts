import type { IconName } from '@civia/ui';

import type { MessageKey } from '@/lib/i18n';

export interface NavItem {
  href: string;
  label: MessageKey;
  icon: IconName;
  /** Fase del roadmap en la que el módulo queda operativo (si aún no lo está). */
  phase?: number;
}

export const NAV_SECTIONS: Array<{ title: MessageKey; items: NavItem[] }> = [
  {
    title: 'nav.section.work',
    items: [
      { href: '/', label: 'nav.home', icon: 'home' },
      { href: '/projects', label: 'nav.projects', icon: 'projects' },
      { href: '/analyze', label: 'nav.analyze', icon: 'analyze', phase: 1 },
      { href: '/reports', label: 'nav.reports', icon: 'report', phase: 1 },
    ],
  },
  {
    title: 'nav.section.field',
    items: [
      { href: '/measure', label: 'nav.measure', icon: 'measure', phase: 4 },
      { href: '/model-3d', label: 'nav.model3d', icon: 'model3d', phase: 3 },
    ],
  },
  {
    title: 'nav.section.knowledge',
    items: [
      { href: '/library', label: 'nav.library', icon: 'library', phase: 1 },
      { href: '/copilot', label: 'nav.copilot', icon: 'copilot', phase: 1 },
    ],
  },
];

/** Barra inferior móvil: Inicio · Proyectos · Medir · Copilot · Perfil. */
export const MOBILE_NAV: NavItem[] = [
  { href: '/', label: 'nav.home', icon: 'home' },
  { href: '/projects', label: 'nav.projects', icon: 'projects' },
  { href: '/measure', label: 'nav.measure', icon: 'measure' },
  { href: '/copilot', label: 'nav.copilot', icon: 'copilot' },
  { href: '/profile', label: 'nav.profile', icon: 'user' },
];

export function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
