import Link from "next/link";
import type { ReactNode } from "react";

import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { TabsNav } from "@/components/ui/tabs";
import { RUTA_SUSCRIPCION } from "@/lib/suscripcion";

const PROXIMA_ENTREGA = "Llega en la próxima entrega";

export type SeccionCobro = "suscripcion" | "planes";

/**
 * Cabecera común de 06 y 08: eyebrow, título, subtítulo, acciones y las pestañas
 * Mi suscripción · Planes · Historial de pagos (09 llega con M2-06).
 */
export function CabeceraCobro({
  eyebrow,
  titulo,
  subtitulo,
  actual,
  children,
}: {
  eyebrow: string;
  titulo: string;
  subtitulo: ReactNode;
  actual: SeccionCobro;
  children?: ReactNode;
}) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium text-muted-foreground">{eyebrow}</p>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">{titulo}</h1>
          <p className="text-muted-foreground">{subtitulo}</p>
        </div>
        {children ? <div className="flex items-center gap-2">{children}</div> : null}
      </header>
      <TabsNav aria-label="Secciones">
        <Link href={RUTA_SUSCRIPCION} aria-current={actual === "suscripcion" ? "page" : undefined}>
          Mi suscripción
        </Link>
        <Link href={RUTA_PLANES} aria-current={actual === "planes" ? "page" : undefined}>
          Planes
        </Link>
        <a aria-disabled="true" tabIndex={-1} title={PROXIMA_ENTREGA} className="pointer-events-none opacity-40">
          Historial de pagos
        </a>
      </TabsNav>
    </>
  );
}
