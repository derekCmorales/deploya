"use client";

import { ReceiptText, RotateCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagos } from "@/hooks/use-pagos";
import { useMiSuscripcion } from "@/hooks/use-suscripcion";
import { AVISO_SIMULADO, filaPorDefecto, subtituloSinPagos } from "@/lib/pagos";

import { CabeceraCobro } from "../../_componentes/cabecera-cobro";
import { PanelComprobante } from "./panel-comprobante";
import { TablaPagos } from "./tabla-pagos";

/** Container de 09 (tabla + comprobante) y 09b (sin pagos). */
export function PagosContenedor() {
  const pagos = usePagos();
  const suscripcion = useMiSuscripcion();
  const [elegida, setElegida] = useState<string | null>(null);
  const [cerrado, setCerrado] = useState(false);
  const filas = pagos.datos ?? [];
  const seleccion = cerrado ? null : (filas.find((f) => f.id === elegida) ?? filaPorDefecto(filas));
  const vacio = pagos.datos !== null && filas.length === 0;
  const abrir = (id: string) => {
    setElegida(id);
    setCerrado(false);
  };

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col lg:flex-row">
      <main
        className={vacio ? "mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-8 pt-7 pb-8" : "flex min-w-0 flex-1 flex-col gap-6 px-8 pt-7 pb-8"}
      >
        <CabeceraCobro
          eyebrow="Cobro · Pagos"
          titulo="Historial de pagos"
          subtitulo={vacio ? subtituloSinPagos(suscripcion.datos?.plan.nombre ?? null) : AVISO_SIMULADO}
          actual="pagos"
        />
        {pagos.error ? (
          <Banner
            variant="bad"
            title="No pudimos cargar tus pagos."
            actions={
              <Button size="sm" variant="outline" onClick={pagos.recargar}>
                <RotateCw />
                Reintentar
              </Button>
            }
          >
            {pagos.error.message}
          </Banner>
        ) : vacio ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-sunken px-8 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-xl border border-border-strong bg-card">
              <ReceiptText className="size-6" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Aún no hay pagos</h2>
            <p className="max-w-[360px] text-muted-foreground">Cuando contrates un plan, aquí verás cada cobro con su comprobante.</p>
            <Button asChild>
              <Link href={RUTA_PLANES}>Ver planes</Link>
            </Button>
          </div>
        ) : pagos.datos ? (
          <TablaPagos filas={filas} seleccion={seleccion?.id ?? null} alSeleccionar={abrir} />
        ) : (
          <div aria-busy="true" aria-label="Cargando tus pagos" className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
      </main>
      {seleccion && !vacio ? <PanelComprobante pago={seleccion} alCerrar={() => setCerrado(true)} /> : null}
    </div>
  );
}
