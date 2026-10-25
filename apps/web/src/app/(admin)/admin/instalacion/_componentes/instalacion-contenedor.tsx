"use client";

import { notFound } from "next/navigation";

import { Banner } from "@/components/ui/banner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminInstalacion } from "@/hooks/use-admin-instalacion";

import { BloqueEstado } from "./bloque-estado";
import { BloqueLimites } from "./bloque-limites";
import { BloqueRegistro } from "./bloque-registro";
import { BloqueRespaldos } from "./bloque-respaldos";
import { BloqueVersion } from "./bloque-version";

const HTTP_NO_ENCONTRADO = 404;

/** Pantalla 32: Estado, Versión, Registro, Límites por proyecto y Respaldos. */
export function InstalacionContenedor() {
  const instalacion = useAdminInstalacion();
  if (instalacion.error?.estado === HTTP_NO_ENCONTRADO) notFound();
  const datos = instalacion.datos;
  const ahora = new Date();

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col px-8 pt-7 pb-8">
      <header className="flex flex-col gap-1 pb-2">
        <p className="text-[13px] text-muted-foreground">Administración</p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Instalación</h1>
        <p className="text-sm text-muted-foreground">{datos ? `${datos.dominio} · autoalojado` : "autoalojado"}</p>
      </header>
      {instalacion.error ? (
        <Banner variant="bad" title="No pudimos leer el estado de la instalación.">
          {instalacion.error.message}
        </Banner>
      ) : !datos ? (
        <div className="flex flex-col gap-4 py-6" aria-busy="true" aria-label="Cargando la instalación">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="flex flex-col">
          <BloqueEstado salud={datos.salud} comprobado={datos.comprobado} ahora={ahora} alComprobar={instalacion.recargar} />
          <BloqueVersion version={datos.version} rutaRespaldos={datos.respaldo.ruta} />
          <BloqueRegistro registro={datos.registro} ahora={ahora} alCambiar={instalacion.recargar} />
          <BloqueLimites limites={datos.limites} alGuardar={instalacion.recargar} />
          <BloqueRespaldos respaldo={datos.respaldo} ahora={ahora} />
        </div>
      )}
    </main>
  );
}
