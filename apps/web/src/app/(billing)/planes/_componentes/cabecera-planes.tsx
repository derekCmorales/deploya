import Link from "next/link";
import type { ReactNode } from "react";

import { TabsNav } from "@/components/ui/tabs";

const PROXIMA_ENTREGA = "Llega en la próxima entrega";

export function CabeceraPlanes({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium text-muted-foreground">Cobro · Planes</p>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Planes</h1>
          <p className="text-muted-foreground">Precios en USD. Pagas por vigencia; nada se renueva sin tu permiso.</p>
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </header>
      <TabsNav aria-label="Secciones">
        <a aria-disabled="true" tabIndex={-1} title={PROXIMA_ENTREGA} className="pointer-events-none opacity-40">
          Mi suscripción
        </a>
        <Link href="/planes" aria-current="page">
          Planes
        </Link>
        <a aria-disabled="true" tabIndex={-1} title={PROXIMA_ENTREGA} className="pointer-events-none opacity-40">
          Historial de pagos
        </a>
      </TabsNav>
    </>
  );
}
