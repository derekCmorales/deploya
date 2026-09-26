import { cn } from "@/lib/utils";

/** Punto de Señal que late: algo está en curso ahora mismo. */
function PuntoVivo({ className }: { className?: string }) {
  return <span aria-hidden className={cn("dy-vivo inline-block size-[7px] shrink-0 rounded-full bg-signal", className)} />;
}

export { PuntoVivo };
