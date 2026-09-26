import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Medidor de consumo frente al límite del plan («96 / 150 construcciones»).
 * Pasa a `warn` desde el 80 % y a `bad` al llegar al límite. `cota` dibuja una marca.
 */
export interface MeterProps {
  label: React.ReactNode;
  value: number;
  max: number;
  /** Texto del valor; por defecto «value / max». */
  valueLabel?: React.ReactNode;
  /** Posición de una marca (misma unidad que `value`). */
  cota?: number;
  className?: string;
}

function Meter({ label, value, max, valueLabel, cota, className }: MeterProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const tono = pct >= 100 ? "bg-bad" : pct >= 80 ? "bg-warn" : "bg-foreground";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tnum font-medium">
          {valueLabel ?? (
            <>
              {value} <span className="text-muted-foreground">/ {max}</span>
            </>
          )}
        </span>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="relative h-1.5 rounded-full bg-muted"
      >
        <span className={cn("absolute inset-y-0 left-0 rounded-full", tono)} style={{ width: `${pct}%` }} />
        {cota !== undefined && max > 0 ? (
          <span
            className="absolute -inset-y-1 w-px bg-border-stronger"
            style={{ left: `${Math.min(100, (cota / max) * 100)}%` }}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}

export { Meter };
