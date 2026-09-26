import type * as React from "react";

import { cn } from "@/lib/utils";

/** Bloque de carga con brillo suave. Respeta `prefers-reduced-motion`. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden className={cn("dy-esqueleto block rounded-sm", className)} {...props} />;
}

export { Skeleton };
