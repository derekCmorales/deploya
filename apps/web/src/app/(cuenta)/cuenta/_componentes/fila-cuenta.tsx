import type { ReactNode } from "react";

/** Fila de 05 y 05b: título y descripción a la izquierda, el contenido (una `Card`) a la derecha. */
export function FilaCuenta({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-border py-6 md:grid-cols-[220px_1fr] md:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
