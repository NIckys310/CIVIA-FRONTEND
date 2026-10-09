/**
 * Escena decorativa de plano estructural: ejes A-B-C-D / 1-2-3-4, columnas, vigas,
 * cotas y una zapata en detalle. Las líneas se "dibujan" al cargar.
 * Es puramente decorativa (aria-hidden).
 */
const AXES_X = [
  { id: 'A', x: 90 },
  { id: 'B', x: 250 },
  { id: 'C', x: 410 },
  { id: 'D', x: 570 },
];
const AXES_Y = [
  { id: '1', y: 120 },
  { id: '2', y: 270 },
  { id: '3', y: 420 },
  { id: '4', y: 570 },
];

export function BlueprintScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 660 680" className={className} aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round">
        {/* Ejes en línea de trazo y punto */}
        <g stroke="var(--c-brand)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="14 4 2 4">
          {AXES_X.map((a) => (
            <path key={a.id} d={`M${a.x} 70V620`} />
          ))}
          {AXES_Y.map((a) => (
            <path key={a.id} d={`M40 ${a.y}H620`} />
          ))}
        </g>

        {/* Burbujas de ejes */}
        <g fontFamily="var(--font-geist-mono), monospace" fontSize="13" fontWeight="600" textAnchor="middle">
          {AXES_X.map((a) => (
            <g key={a.id}>
              <circle cx={a.x} cy="48" r="15" stroke="var(--c-brand)" strokeWidth="1.25" fill="var(--c-surface)" />
              <text x={a.x} y="52.5" fill="var(--c-brand)">{a.id}</text>
            </g>
          ))}
          {AXES_Y.map((a) => (
            <g key={a.id}>
              <circle cx="22" cy={a.y} r="15" stroke="var(--c-brand)" strokeWidth="1.25" fill="var(--c-surface)" />
              <text x="22" y={a.y + 4.5} fill="var(--c-brand)">{a.id}</text>
            </g>
          ))}
        </g>

        {/* Vigas (se dibujan) */}
        <g stroke="var(--c-text)" strokeOpacity="0.75" strokeWidth="2">
          <path className="draw" style={{ ['--path-length' as string]: 2000 }} d="M90 120H570V570H90Z" />
          <path className="draw" style={{ ['--path-length' as string]: 500, animationDelay: '0.25s' }} d="M90 270H570" />
          <path className="draw" style={{ ['--path-length' as string]: 500, animationDelay: '0.4s' }} d="M90 420H570" />
          <path className="draw" style={{ ['--path-length' as string]: 500, animationDelay: '0.55s' }} d="M250 120V570" />
          <path className="draw" style={{ ['--path-length' as string]: 500, animationDelay: '0.7s' }} d="M410 120V570" />
        </g>

        {/* Columnas en cada intersección */}
        <g fill="var(--c-text)" fillOpacity="0.85">
          {AXES_X.flatMap((a) =>
            AXES_Y.map((b) => <rect key={`${a.id}${b.id}`} x={a.x - 9} y={b.y - 9} width="18" height="18" rx="1" />),
          )}
        </g>

        {/* Columna destacada en revisión (C-2) */}
        <g>
          <rect x="396" y="256" width="28" height="28" rx="2" stroke="var(--c-accent)" strokeWidth="2" />
          <path d="M424 256l40-40h86" stroke="var(--c-accent)" strokeWidth="1.25" />
          <text x="472" y="208" fontFamily="var(--font-geist-mono), monospace" fontSize="13" fontWeight="600" fill="var(--c-accent)">
            C-07 · 30×30
          </text>
        </g>

        {/* Cota horizontal A-B */}
        <g stroke="var(--c-text-muted)" strokeWidth="1">
          <path d="M90 600v26M250 600v26M90 618h160" />
          <path d="M90 618l8-4M90 618l8 4M250 618l-8-4M250 618l-8 4" />
        </g>
        <text x="170" y="610" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace" fontSize="12" fill="var(--c-text-muted)">
          4.80
        </text>

        {/* Cota vertical 1-2 */}
        <g stroke="var(--c-text-muted)" strokeWidth="1">
          <path d="M600 120h26M600 270h26M618 120v150" />
          <path d="M618 120l-4 8M618 120l4 8M618 270l-4-8M618 270l4-8" />
        </g>
        <text x="640" y="199" fontFamily="var(--font-geist-mono), monospace" fontSize="12" fill="var(--c-text-muted)" transform="rotate(90 640 199)" textAnchor="middle">
          4.20
        </text>

        {/* Marca de nivel */}
        <g stroke="var(--c-text-muted)" strokeWidth="1">
          <path d="M120 470h70M150 470l-8-10h16z" />
        </g>
        <text x="196" y="474" fontFamily="var(--font-geist-mono), monospace" fontSize="12" fill="var(--c-text-muted)">
          N+3.00
        </text>
      </g>
    </svg>
  );
}
