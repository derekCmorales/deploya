import type { ReactNode } from "react";

/**
 * Un paso del asistente (artboard 31): título, explicación, el contenido (cada paso pone su
 * tarjeta) y debajo, fuera de la tarjeta, la fila de Atrás / Continuar.
 */
export function MarcoPaso({
  titulo,
  descripcion,
  acciones,
  children,
}: {
  titulo: string;
  descripcion?: string;
  acciones: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em] text-balance">{titulo}</h1>
        {descripcion ? <p className="text-sm text-muted-foreground">{descripcion}</p> : null}
      </div>
      {children}
      <div className="flex items-center justify-between gap-3">{acciones}</div>
    </section>
  );
}
