import type { MetadataRoute } from 'next';

/** PWA instalable ("Añadir a pantalla de inicio"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CIVIA AI — Copiloto del ingeniero civil',
    short_name: 'CIVIA',
    description: 'Planos, normativa, cálculo y obra en un solo lugar.',
    lang: 'es-CO',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#F5F4F0',
    theme_color: '#1D5FB4',
    categories: ['productivity', 'business', 'utilities'],
    icons: [
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Analizar plano', url: '/analyze' },
      { name: 'Medir', url: '/measure' },
      { name: 'Proyectos', url: '/projects' },
    ],
  };
}
