import type { ReactNode } from "react";

/** Bloque de la 32 (como 05b): título y descripción a la izquierda, el contenido a la derecha. */
export function FilaAjuste({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-border py-6 md:grid-cols-[280px_1fr] md:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{titulo}</h2>
        <p className="text-[13px] text-muted-foreground">{descripcion}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
