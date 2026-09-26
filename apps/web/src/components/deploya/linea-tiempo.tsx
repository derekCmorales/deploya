import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/** Línea de tiempo vertical (último despliegue en Resumen, actividad de admin). */
function LineaTiempo({
  items,
  className,
}: {
  items: { icono: LucideIcon; titulo: React.ReactNode; detalle?: React.ReactNode; hora?: string; tono?: "ok" | "bad" | "signal" }[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((it, i) => {
        const Icono = it.icono;
        return (
          <li key={i} className="relative grid grid-cols-[20px_1fr_auto] gap-x-3 pb-3.5 last:pb-0">
            {i < items.length - 1 ? <span className="absolute top-[18px] bottom-0 left-[9px] w-px bg-border-strong" aria-hidden /> : null}
            <span
              className={cn(
                "z-10 grid size-5 place-items-center rounded-full border border-border-strong bg-card text-muted-foreground",
                it.tono === "ok" && "text-ok",
                it.tono === "bad" && "text-bad",
                it.tono === "signal" && "text-signal",
              )}
            >
              <Icono className="size-3" aria-hidden />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium">{it.titulo}</span>
              {it.detalle ? <span className="text-xs text-muted-foreground">{it.detalle}</span> : null}
            </span>
            {it.hora ? <span className="tnum font-mono text-xs text-muted-foreground">{it.hora}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

export { LineaTiempo };
