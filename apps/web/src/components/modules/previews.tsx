/**
 * Vistas previas inertes de módulos de fases futuras. Muestran la dirección de diseño
 * con datos de EJEMPLO claramente rotulados; no son funcionalidad real.
 */
import { Icon } from '../ui/icon';
import { StatusBadge } from '../ui/status-badge';

const EXAMPLE = (
  <span className="label-tech absolute right-3 top-3 rounded-sm bg-surface/90 px-1.5 py-0.5 text-subtle">Ejemplo</span>
);

/** CIVIA Measure: cámara con retícula tipo mira de topografía y lectura en vivo. */
export function MeasurePreview() {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div className="relative aspect-[9/19] overflow-hidden rounded-[36px] border-[6px] border-text/85 bg-[#1b2230] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#4a5568_0%,#202736_70%)]" />
        {/* Columna en cámara */}
        <div className="absolute left-[38%] top-[18%] h-[56%] w-[24%] bg-[linear-gradient(90deg,#8a8f98,#b4b8bf_40%,#9399a2)]" />
        {/* Retícula */}
        <svg viewBox="0 0 100 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <g stroke="#fff" strokeWidth="0.4" fill="none" opacity="0.9">
            <circle cx="50" cy="92" r="16" />
            <path d="M50 70v12M50 102v12M28 92h12M60 92h12" />
          </g>
          <g stroke="#FF7A2E" strokeWidth="0.7" fill="none">
            <path d="M38 40v-4M62 40v-4M38 38h24" />
            <path d="M34 36h-3M34 148h-3M32.5 36v112" />
          </g>
          <rect x="38" y="36" width="24" height="112" fill="none" stroke="#FF7A2E" strokeWidth="0.8" strokeDasharray="2 1.5" />
        </svg>
        {/* HUD */}
        <div className="absolute inset-x-3 top-5 flex items-center justify-between text-[10px] font-semibold text-white">
          <span className="rounded-full bg-black/45 px-2 py-1">ESTIMACIÓN</span>
          <span className="rounded-full bg-black/45 px-2 py-1">Confianza 0.86</span>
        </div>
        <div className="absolute inset-x-3 bottom-20 grid grid-cols-3 gap-1.5 text-center font-mono text-white">
          {[
            ['Ancho', '0.30'],
            ['Prof.', '0.30'],
            ['Altura', '2.95'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-black/55 px-1 py-1.5 backdrop-blur-sm">
              <div className="text-[8px] uppercase tracking-wider text-white/70">{k}</div>
              <div className="text-[13px] font-semibold">{v} m</div>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-6">
          <span className="h-10 w-10 rounded-full bg-white/20" />
          <span className="h-14 w-14 rounded-full border-4 border-white bg-[#FF7A2E]" />
          <span className="h-10 w-10 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

/** Analizador de planos: progreso por etapas. */
export function AnalyzePreview() {
  const stages = [
    ['Leyendo plano', 'done'],
    ['OCR de cotas y textos', 'done'],
    ['Detectando elementos', 'active'],
    ['Verificando', 'pending'],
  ] as const;
  return (
    <div className="relative rounded-lg border border-border bg-surface p-5">
      {EXAMPLE}
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-alt text-brand">
          <Icon name="plan" size={22} />
        </span>
        <div>
          <p className="font-data text-[13px] font-semibold">E-02_Estructural_v03.pdf</p>
          <p className="text-[12px] text-muted">Página 1 de 4 · 2.4 MB</p>
        </div>
      </div>
      <ol className="mt-5 flex flex-col gap-3">
        {stages.map(([label, state], i) => (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span
              className={
                state === 'done'
                  ? 'flex h-6 w-6 items-center justify-center rounded-full bg-ok-soft text-ok'
                  : state === 'active'
                    ? 'flex h-6 w-6 items-center justify-center rounded-full bg-brand text-on-brand'
                    : 'flex h-6 w-6 items-center justify-center rounded-full border border-border text-subtle'
              }
            >
              {state === 'done' ? <Icon name="statusOk" size={14} /> : <span className="font-data text-[11px]">{i + 1}</span>}
            </span>
            <span className={state === 'pending' ? 'text-subtle' : 'text-text'}>{label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full w-[62%] rounded-full bg-brand" />
      </div>
    </div>
  );
}

/** CIVIA Copilot: respuesta con chips de cita a la fuente. */
export function CopilotPreview() {
  return (
    <div className="relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      {EXAMPLE}
      <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-brand px-3.5 py-2.5 text-sm text-on-brand">
        Explícame el hallazgo de la columna C-07.
      </div>
      <div className="max-w-[92%] rounded-lg rounded-bl-sm border border-border bg-surface-alt px-3.5 py-3 text-sm">
        <p>
          Posible inconsistencia: la columna <span className="font-data">C-07</span> aparece en el nivel{' '}
          <span className="font-data">N+3.00</span> pero no en <span className="font-data">N+6.00</span>. Se recomienda
          revisar la continuidad del elemento.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="font-data inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-brand">
            <Icon name="library" size={12} /> NSR-10 · Título C
          </span>
          <span className="font-data inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-brand">
            <Icon name="plan" size={12} /> E-03 · p.1
          </span>
        </div>
      </div>
      <p className="text-[12px] text-subtle">Respuestas solo con soporte en fuentes citadas. Si no hay soporte, lo dice.</p>
    </div>
  );
}

/** Informe de revisión: resumen ejecutivo con contadores. */
export function ReportPreview() {
  return (
    <div className="relative rounded-lg border border-border bg-surface p-5">
      {EXAMPLE}
      <p className="label-tech text-subtle">Informe de revisión</p>
      <p className="mt-1 text-lg font-semibold">Proyecto Torre Norte</p>
      <p className="font-data text-[12px] text-muted">27 planos · 436 elementos · 14 hallazgos</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status="danger" count={2} />
        <StatusBadge status="warn" count={8} />
        <StatusBadge status="ok" count={4} />
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {[88, 72, 94, 60].map((w, i) => (
          <div key={i} className="h-2 rounded-full bg-surface-alt" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Visor 3D: pórtico isométrico por niveles. */
export function ModelPreview() {
  const levels = [0, 1, 2];
  return (
    <div className="bg-blueprint relative overflow-hidden rounded-lg border border-border">
      {EXAMPLE}
      <svg viewBox="0 0 320 240" className="w-full" aria-hidden="true">
        <g fill="none" strokeLinecap="round">
          {levels.map((l) => {
            const y = 190 - l * 55;
            return (
              <g key={l} stroke="var(--c-text)" strokeOpacity={0.35 + l * 0.2} strokeWidth="1.5">
                <path d={`M60 ${y}L160 ${y + 30}L260 ${y}L160 ${y - 30}Z`} fill="var(--c-surface)" fillOpacity="0.6" />
              </g>
            );
          })}
          <g stroke="var(--c-text)" strokeWidth="2">
            {[
              [60, 190],
              [160, 220],
              [260, 190],
              [160, 160],
            ].map(([x, y]) => (
              <path key={`${x}-${y}`} d={`M${x} ${y}V${y! - 110}`} />
            ))}
          </g>
          <path d="M260 80V190" stroke="var(--c-accent)" strokeWidth="3" />
          <circle cx="260" cy="80" r="4" fill="var(--c-accent)" />
        </g>
      </svg>
    </div>
  );
}

/** Biblioteca técnica: categorías. */
export function LibraryPreview() {
  const cats: Array<[string, 'footing' | 'column' | 'soil' | 'square' | 'library', string]> = [
    ['Cimentaciones', 'footing', 'Zapatas, losas, pilotes'],
    ['Estructuras', 'column', 'Concreto, acero, mampostería'],
    ['Geotecnia', 'soil', 'SPT, capacidad portante, taludes'],
    ['Diseño', 'square', 'Criterios y detallado'],
    ['Normativa', 'library', 'NSR-10, Ley 400, Ley 1796'],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cats.map(([name, icon, desc]) => (
        <div key={name} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Icon name={icon} size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{name}</p>
            <p className="truncate text-[12px] text-muted">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
