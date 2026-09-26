"use client";

import { cn } from "@/lib/utils";

/** Interruptor accesible (`role="switch"`). Etiqueta visible al lado o `aria-label`. */
function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ...props
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border border-border-strong bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-checked:border-primary aria-checked:bg-primary",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 size-3.5 rounded-full bg-muted-foreground transition-transform",
          checked && "translate-x-4 bg-primary-foreground",
        )}
      />
    </button>
  );
}

export { Switch };
