import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Lista desplegable nativa (opciones cortas y cerradas, p. ej. el motivo de 25b). Misma altura,
 * fondo y foco que `Input`. Para filtros en línea con etiqueta usa `Segmented`.
 */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(({ className, ...props }, ref) => (
  <select
    className={cn(
      "flex h-9 w-full min-w-0 cursor-pointer rounded-md border border-input bg-sunken px-2 text-sm text-foreground transition-[border-color,box-shadow] focus-visible:border-signal focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-signal-soft disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-bad aria-invalid:focus-visible:ring-bad/15",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Select.displayName = "Select";

export { Select };
