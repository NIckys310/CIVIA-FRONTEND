'use client';

import type { IconName } from '@civia/ui';
import { notFound, useParams } from 'next/navigation';
import type { ReactNode } from 'react';

import {
  AnalyzePreview,
  CopilotPreview,
  LibraryPreview,
  MeasurePreview,
  ModelPreview,
  ReportPreview,
} from '@/components/modules/previews';
import { Disclaimer, Page, PageHeader } from '@/components/shell/page';
import { CotaLabel } from '@/components/ui/cota-label';
import { Icon } from '@/components/ui/icon';
import { PhaseBadge } from '@/components/ui/misc';
import { useT, type MessageKey } from '@/lib/i18n';

interface ModuleInfo {
  title: MessageKey;
  icon: IconName;
  phase: number;
  summary: string;
  features: string[];
  preview: ReactNode;
}

const MODULES: Record<string, ModuleInfo> = {
  analyze: {
    title: 'nav.analyze',
    icon: 'analyze',
    phase: 1,
    summary: 'Sube un plano estructural, arquitectónico o de cimentación. La IA lo interpreta y el sistema señala lo que debe revisar un ingeniero.',
    features: [
      'PDF, imágenes y fotos de planos físicos (con corrección de perspectiva)',
      'OCR de cotas, tablas y rótulos',
      'Detección de columnas, vigas, zapatas, ejes y cotas con nivel de confianza',
      'Corrección manual de elementos mal detectados, con registro',
    ],
    preview: <AnalyzePreview />,
  },
  reports: {
    title: 'nav.reports',
    icon: 'report',
    phase: 1,
    summary: 'Informes de revisión listos para firmar: cada hallazgo enlaza al área exacta del plano.',
    features: [
      'Resumen ejecutivo con contadores por estado',
      'Exportación PDF y DOCX',
      'Aprobación del ingeniero responsable con hash del informe (no repudio)',
      'Versiones inmutables: editar crea una nueva versión',
    ],
    preview: <ReportPreview />,
  },
  measure: {
    title: 'nav.measure',
    icon: 'measure',
    phase: 4,
    summary: 'CIVIA Measure: mide columnas, vanos, áreas y volúmenes desde el celular y compáralos contra el plano.',
    features: [
      'Retícula tipo mira de topografía y lectura en vivo',
      'Siempre rotulado como estimación, con nivel de confianza',
      'AR/LiDAR cuando el dispositivo lo soporta; referencia de escala si no',
      'Evidencia fotográfica con metadatos y sincronización offline',
    ],
    preview: <MeasurePreview />,
  },
  'model-3d': {
    title: 'nav.model3d',
    icon: 'model3d',
    phase: 3,
    summary: 'Del plano 2D al modelo estructural 3D: rota, corta por niveles y selecciona un elemento para ver su ficha.',
    features: [
      'Capas por tipo de elemento, aislar y ocultar',
      'Colores por estado de revisión',
      'Modo explosión por niveles',
      'Importación BIM / IFC',
    ],
    preview: <ModelPreview />,
  },
  library: {
    title: 'nav.library',
    icon: 'library',
    phase: 1,
    summary: 'Biblioteca técnica y normativa con búsqueda semántica. Cada fragmento conserva norma, versión, capítulo y página.',
    features: [
      'Colombia primero: NSR-10 (Títulos A–I), Ley 400 de 1997, Ley 1796 de 2016',
      'Selector de país y versión de norma',
      'Solo documentos de uso permitido u oficial',
      'Citas resaltadas en el documento fuente',
    ],
    preview: <LibraryPreview />,
  },
  copilot: {
    title: 'nav.copilot',
    icon: 'copilot',
    phase: 1,
    summary: 'Pregunta sobre tus planos, hallazgos y la normativa. Responde solo con fuentes citadas; los cálculos los hace el motor, no la IA.',
    features: [
      'Panel acoplable junto al visor de planos',
      'Chips de cita que abren la fuente',
      'Acciones rápidas: “Explicar este hallazgo”, “¿Qué información necesito?”',
      'Indica qué datos usó para responder',
    ],
    preview: <CopilotPreview />,
  },
};

export default function ModulePage() {
  const t = useT();
  const { module } = useParams<{ module: string }>();
  const info = MODULES[module];
  if (!info) notFound();

  return (
    <Page>
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <Icon name={info.icon} size={16} />
            {t('phase.comingSoon')}
          </span>
        }
        title={t(info.title)}
        description={info.summary}
        actions={<PhaseBadge phase={info.phase} label={t('phase.badge')} />}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-12">
        <section aria-label="Alcance del módulo" className="order-2 lg:order-1">
          <CotaLabel className="mb-5">Alcance</CotaLabel>
          <ul className="flex flex-col gap-3">
            {info.features.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
                <Icon name="statusOk" size={18} className="mt-px shrink-0 text-brand" />
                {f}
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Vista previa" className="order-1 lg:order-2">
          {info.preview}
        </section>
      </div>

      <Disclaimer text={t('app.disclaimer')} />
    </Page>
  );
}
