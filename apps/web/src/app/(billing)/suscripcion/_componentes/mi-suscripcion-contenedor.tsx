"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanes } from "@/hooks/use-planes";
import { useProyectos } from "@/hooks/use-proyectos";
import { useSesion } from "@/hooks/use-sesion";
import { useMiSuscripcion } from "@/hooks/use-suscripcion";

import { CabeceraCobro } from "../../_componentes/cabecera-cobro";
import { PanelCambiarPlan } from "./panel-cambiar-plan";
import { PanelConsumo } from "./panel-consumo";
import { TarjetaPlanActual } from "./tarjeta-plan-actual";

/** Container de 08: la suscripción, el catálogo para cambiar de plan y el consumo de proyectos. */
export function MiSuscripcionContenedor() {
  const { usuario } = useSesion();
  const suscripcion = useMiSuscripcion();
  const { estado: catalogo } = usePlanes();
  const { datos: proyectos } = useProyectos({ sondear: false });
  const [ahora] = useState(() => new Date());

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-8 pt-7 pb-8">
      <CabeceraCobro
        eyebrow="Cobro · Suscripción"
        titulo="Mi suscripción"
        subtitulo={usuario ? `Titular ${usuario.nombre}` : "Tu plan, su vigencia y lo que llevas usado."}
        actual="suscripcion"
      />
      {suscripcion.error ? (
        <Banner
          variant="bad"
          title="No pudimos cargar tu suscripción."
          actions={
            <Button size="sm" variant="outline" onClick={suscripcion.recargar}>
              <RotateCw />
              Reintentar
            </Button>
          }
        >
          {suscripcion.error.message}
        </Banner>
      ) : null}
      {suscripcion.datos ? (
        <>
          <TarjetaPlanActual suscripcion={suscripcion.datos} ahora={ahora} />
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[3fr_2fr]">
            <PanelConsumo suscripcion={suscripcion.datos} proyectos={proyectos} />
            <PanelCambiarPlan
              suscripcion={suscripcion.datos}
              catalogo={catalogo.tipo === "listo" ? catalogo.planes : null}
              alCambiar={suscripcion.recargar}
            />
          </div>
        </>
      ) : suscripcion.error ? null : (
        <div aria-busy="true" aria-label="Cargando tu suscripción" className="flex flex-col gap-6">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
    </main>
  );
}
