interface ChipEventoProps {
  x: number;
  version: number;
  alto: number;
}

/** Despliegue marcado como evento: línea punteada y chip mono `#14` (regla 4). */
export function ChipEvento({ x, version, alto }: ChipEventoProps) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <line x1="0" y1="0" x2="0" y2={alto} stroke="var(--foreground)" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.55" />
      <foreignObject x="-17" y="2" width="34" height="16">
        <div className="flex h-4 items-center justify-center rounded border border-border bg-card px-1 font-mono text-[9px] font-medium tnum text-foreground">
          #{version}
        </div>
      </foreignObject>
    </g>
  );
}
