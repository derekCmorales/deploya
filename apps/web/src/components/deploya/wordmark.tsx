import { cn } from "@/lib/utils";

/**
 * Marca: la palabra «deploya» en minúsculas, Geist 700, tracking cerrado,
 * con la última «a» en Señal. No hay símbolo. No cambiar mayúsculas ni colores.
 */
function Wordmark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-baseline leading-none font-bold text-foreground", className)}
      style={{ fontSize: size, letterSpacing: size >= 48 ? "-0.065em" : "-0.06em" }}
    >
      deploy<span className="text-signal">a</span>
    </span>
  );
}

export { Wordmark };
