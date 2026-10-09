/**
 * Miniatura de plano generada de forma determinista a partir del id del proyecto:
 * cada proyecto tiene su propia planta (número de vanos, voladizos) mientras no haya
 * planos reales subidos.
 */
function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function PlanThumbnail({ id, className }: { id: string; className?: string }) {
  const rand = seeded(id);
  const bays = 2 + Math.floor(rand() * 3); // 2-4 vanos en x
  const rows = 2 + Math.floor(rand() * 2); // 2-3 en y
  const W = 200;
  const H = 120;
  const pad = 22;
  const xs = Array.from({ length: bays + 1 }, (_, i) => pad + (i * (W - 2 * pad)) / bays);
  const ys = Array.from({ length: rows + 1 }, (_, i) => pad + (i * (H - 2 * pad)) / rows);
  const highlight = { x: xs[Math.floor(rand() * xs.length)]!, y: ys[Math.floor(rand() * ys.length)]! };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width={W} height={H} fill="var(--c-surface-alt)" />
      <g stroke="var(--c-grid-strong)" strokeWidth="0.5">
        {Array.from({ length: 20 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 10} 0V${H}`} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 10}H${W}`} />
        ))}
      </g>
      <g stroke="var(--c-brand)" strokeOpacity="0.5" strokeWidth="0.6" strokeDasharray="5 2 1 2">
        {xs.map((x) => (
          <path key={`ax${x}`} d={`M${x} 8V${H - 8}`} />
        ))}
        {ys.map((y) => (
          <path key={`ay${y}`} d={`M8 ${y}H${W - 8}`} />
        ))}
      </g>
      <g stroke="var(--c-text)" strokeOpacity="0.7" strokeWidth="1.2" fill="none">
        <rect x={xs[0]} y={ys[0]} width={xs.at(-1)! - xs[0]!} height={ys.at(-1)! - ys[0]!} />
        {xs.slice(1, -1).map((x) => (
          <path key={`bx${x}`} d={`M${x} ${ys[0]}V${ys.at(-1)}`} />
        ))}
        {ys.slice(1, -1).map((y) => (
          <path key={`by${y}`} d={`M${xs[0]} ${y}H${xs.at(-1)}`} />
        ))}
      </g>
      <g fill="var(--c-text)" fillOpacity="0.8">
        {xs.flatMap((x) => ys.map((y) => <rect key={`c${x}-${y}`} x={x - 3} y={y - 3} width="6" height="6" />))}
      </g>
      <rect x={highlight.x - 6} y={highlight.y - 6} width="12" height="12" fill="none" stroke="var(--c-accent)" strokeWidth="1.4" />
    </svg>
  );
}
