"use client";

import { ReceiptText, RotateCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const filas = pagos.datos ?? [];
  const seleccion = filas.find((f) => f.id === elegida) ?? filaPorDefecto(filas);
  const vacio = pagos.datos !== null && filas.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-8 pt-7 pb-8">
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
        <Card className="flex flex-col items-center gap-3 px-8 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-xl border border-border-strong bg-sunken text-muted-foreground">
            <ReceiptText className="size-5" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Aún no hay pagos</h2>
          <p className="max-w-[360px] text-muted-foreground">Cuando contrates un plan, aquí verás cada cobro con su comprobante.</p>
          <Button asChild size="sm">
            <Link href={RUTA_PLANES}>Ver planes</Link>
          </Button>
        </Card>
      ) : pagos.datos ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_400px]">
          <TablaPagos filas={filas} seleccion={seleccion?.id ?? null} alSeleccionar={setElegida} />
          {seleccion ? <PanelComprobante pago={seleccion} /> : null}
        </div>
      ) : (
        <div aria-busy="true" aria-label="Cargando tus pagos" className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      )}
    </main>
  );
}
