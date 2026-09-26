import { cn } from "@/lib/utils";

/**
 * Mapa de actividad de despliegues (12 semanas × 7 días, pantalla 13).
 * Cada día: número de despliegues y si alguno falló.
 */
function MapaActividad({ dias, className }: { dias: { total: number; fallidos: number; fecha: string }[]; className?: string }) {
  const tono = (d: { total: number; fallidos: number }) =>
    d.fallidos > 0
      ? "bg-bad"
      : d.total === 0
        ? "bg-muted"
        : d.total === 1
          ? "bg-[color-mix(in_oklab,var(--signal)_28%,var(--muted))]"
          : d.total <= 3
            ? "bg-[color-mix(in_oklab,var(--signal)_55%,var(--muted))]"
            : "bg-signal";
  return (
    <div
      role="img"
      aria-label={`Actividad: ${dias.reduce((a, d) => a + d.total, 0)} despliegues, ${dias.reduce((a, d) => a + d.fallidos, 0)} con fallo`}
      className={cn("grid grid-flow-col grid-rows-7 gap-[3px] [grid-auto-columns:12px]", className)}
    >
      {dias.map((d) => (
        <i key={d.fecha} title={`${d.fecha}: ${d.total}`} className={cn("block size-3 rounded-[3px]", tono(d))} />
      ))}
    </div>
  );
}

export { MapaActividad };
