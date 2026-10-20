import Link from "next/link";
import type { ReactNode } from "react";

import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { TabsNav } from "@/components/ui/tabs";
import { RUTA_PAGOS, RUTA_SUSCRIPCION } from "@/lib/suscripcion";

export type SeccionCobro = "suscripcion" | "planes" | "pagos";

/**
 * Cabecera común de 06, 08 y 09: eyebrow, título, subtítulo, acciones y las pestañas
 * Mi suscripción · Planes · Historial de pagos.
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
        <Link href={RUTA_PAGOS} aria-current={actual === "pagos" ? "page" : undefined}>
          Historial de pagos
        </Link>
      </TabsNav>
    </>
  );
}
