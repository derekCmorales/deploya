"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Control segmentado (p. ej. «30 días · 365 días» en Planes, filtros de historial).
 * Es un grupo de radio accesible: flechas izquierda/derecha cambian la opción.
 */
export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  "aria-label": string;
  size?: "default" | "sm";
  className?: string;
}

function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size = "default",
  className,
  ...props
}: SegmentedProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  function mover(indice: number) {
    const i = (indice + options.length) % options.length;
    onValueChange(options[i].value);
    refs.current[i]?.focus();
  }
  return (
    <div
      role="radiogroup"
      aria-label={props["aria-label"]}
      className={cn(
        "inline-flex gap-0.5 rounded-lg bg-muted p-[3px]",
        size === "sm" ? "h-8" : "h-9",
        className,
      )}
    >
      {options.map((o, i) => {
        const activo = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            onClick={() => onValueChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") mover(i + 1);
              if (e.key === "ArrowLeft") mover(i - 1);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[7px] border border-transparent px-3 text-[13px] font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activo && "border-border bg-background text-foreground shadow-sm",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
