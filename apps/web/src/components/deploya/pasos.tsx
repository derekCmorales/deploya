import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Pasos de un asistente (Nuevo proyecto: Repositorio · Variables · Revisar).
 * `actual` es 0-based. Los pasos previos se marcan completos.
 */
function Pasos({
  pasos,
  actual,
  className,
}: {
  pasos: readonly { titulo: string; detalle?: string; deshabilitado?: boolean }[];
  actual: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col gap-1", className)} aria-label="Pasos">
      {pasos.map((p, i) => {
        const hecho = i < actual;
        const activo = i === actual;
        return (
          <li
            key={p.titulo}
            aria-current={activo ? "step" : undefined}
            className={cn(
              "flex items-start gap-3 rounded-lg px-3 py-2.5",
              activo && "bg-muted",
              p.deshabilitado && "opacity-50",
            )}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border font-mono text-[11px]",
                hecho && "border-ok bg-ok/10 text-ok",
                activo && "border-signal text-signal",
                !hecho && !activo && "border-border-strong text-muted-foreground",
              )}
            >
              {hecho ? <Check className="size-3.5" aria-hidden /> : String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex flex-col">
              <span className={cn("text-sm font-medium", !activo && !hecho && "text-muted-foreground")}>{p.titulo}</span>
              {p.detalle ? <span className="text-xs text-muted-foreground">{p.detalle}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export { Pasos };
