import { cn } from "@/lib/utils";

import { ETAPAS, type EstadoEtapa } from "./estados";

const TONO: Record<EstadoEtapa, string> = {
  pendiente: "bg-border-strong",
  "en-curso": "dy-barrido",
  completada: "bg-muted-foreground",
  fallida: "bg-bad",
  aviso: "bg-warn",
  omitida: "bg-faint",
};

export interface RielEtapasProps {
  /** Estado de cada una de las cinco etapas, en orden. */
  etapas: readonly EstadoEtapa[];
  /** `sm` en listas (55px), `lg` en cabeceras con etiquetas. */
  size?: "sm" | "lg";
  /** Muestra nombre y duración debajo de cada segmento (solo `lg`). */
  detalle?: readonly { duracion?: string }[];
  /** Pinta la última etapa completada en `ok` cuando todo terminó bien. */
  saludable?: boolean;
  className?: string;
}

/**
 * Riel de cinco etapas: Recepción → Construcción → Ejecución → Enrutamiento → Operación.
 * Único motivo recurrente del producto. Siempre cinco segmentos y en este orden.
 * Informa, no decora.
 */
function RielEtapas({ etapas, size = "sm", detalle, saludable, className }: RielEtapasProps) {
  const resumen = ETAPAS.map((n, i) => `${n}: ${etapas[i] ?? "pendiente"}`).join(", ");
  if (size === "sm") {
    return (
      <span role="img" aria-label={resumen} className={cn("inline-flex shrink-0 gap-0.5", className)}>
        {ETAPAS.map((n, i) => {
          const e = etapas[i] ?? "pendiente";
          return (
            <i
              key={n}
              className={cn("block h-1 w-[9px] rounded-[1px]", saludable && e === "completada" ? "bg-ok" : TONO[e])}
            />
          );
        })}
      </span>
    );
  }
  return (
    <ol aria-label="Etapas del despliegue" className={cn("grid grid-cols-5 gap-1.5", className)}>
      {ETAPAS.map((n, i) => {
        const e = etapas[i] ?? "pendiente";
        return (
          <li key={n} className="flex flex-col gap-2">
            <span
              className={cn("block h-[5px] rounded-[2px]", saludable && e === "completada" ? "bg-ok" : TONO[e])}
              aria-hidden
            />
            <span className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className={cn("font-medium", e === "pendiente" && "text-muted-foreground")}>{n}</span>
              <span className="tnum text-xs text-muted-foreground">{detalle?.[i]?.duracion ?? "—"}</span>
            </span>
            <span className="sr-only">{e}</span>
          </li>
        );
      })}
    </ol>
  );
}

export { RielEtapas };
