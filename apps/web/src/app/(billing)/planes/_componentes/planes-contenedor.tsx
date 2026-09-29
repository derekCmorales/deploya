"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Segmented } from "@/components/ui/segmented";
import { usePlanes } from "@/hooks/use-planes";
import { VIGENCIAS, type Vigencia } from "@/lib/planes";

import { CabeceraPlanes } from "./cabecera-planes";
import { TablaPlanes, TablaPlanesCargando } from "./tabla-planes";

export function PlanesContenedor() {
  const { estado, reintentar } = usePlanes();
  const [vigencia, setVigencia] = useState<Vigencia>("30");

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-8 pt-7 pb-8">
      <CabeceraPlanes>
        <span className="text-[13px] text-muted-foreground">Vigencia</span>
        <Segmented aria-label="Vigencia" value={vigencia} onValueChange={setVigencia} options={VIGENCIAS} />
      </CabeceraPlanes>
      {estado.tipo === "cargando" ? <TablaPlanesCargando /> : null}
      {estado.tipo === "error" ? (
        <Banner
          variant="bad"
          title="No pudimos cargar los planes."
          actions={
            <Button size="sm" variant="outline" onClick={reintentar}>
              Reintentar
            </Button>
          }
        >
          Revisa tu conexión e inténtalo de nuevo.
        </Banner>
      ) : null}
      {estado.tipo === "listo" ? <TablaPlanes planes={estado.planes} vigencia={vigencia} codigoActual={null} /> : null}
    </main>
  );
}
