"use client";

import { useCallback, type ReactNode } from "react";

import { ErrorConexionApi } from "@/components/estados/error-conexion-api";
import { GraficaEtapas } from "@/components/deploya";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumen } from "@/hooks/use-resumen";
import { useTiempos } from "@/hooks/use-tiempos";
import { esFalloDeConexion } from "@/lib/reintento";
import { consultaTiempos, indicadoresTiempos, subtituloTiempos, type IndicadoresTiempos } from "@/lib/tiempos";

/**
 * 14c · Tiempo por etapa: la tarjeta que va encima del historial. Los tiempos salen de
 * `GET /proyectos/:id/despliegues/tiempos`; el nombre y la versión activa, del resumen.
 */
export function TarjetaTiempos({ proyectoId }: { proyectoId: string }) {
  const tiempos = useTiempos(proyectoId);
  const resumen = useResumen(proyectoId, null);
  const error = tiempos.error ?? resumen.error;
  const { recargar: recargarTiempos } = tiempos;
  const { recargar: recargarResumen } = resumen;
  const recargar = useCallback(() => {
    recargarTiempos();
    recargarResumen();
  }, [recargarTiempos, recargarResumen]);

  if (tiempos.datos?.despliegues.length === 0) return null;

  if (error && (!tiempos.datos || !resumen.datos)) {
    return (
      <Marco>
        {esFalloDeConexion(error.estado) ? (
          <ErrorConexionApi error={error} ruta={consultaTiempos(proyectoId)} onReintentar={recargar} />
        ) : (
          <Banner
            variant="bad"
            title="No pudimos cargar el tiempo por etapa"
            actions={
              <Button type="button" variant="outline" size="sm" onClick={recargar}>
                Reintentar
              </Button>
            }
          >
            {error.message}
          </Banner>
        )}
      </Marco>
    );
  }

  if (tiempos.cargando || resumen.cargando || !tiempos.datos || !resumen.datos) {
    return (
      <Marco>
        <Card aria-busy="true" aria-label="Cargando tiempo por etapa">
          <CardHeader className="flex-col items-start gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[0, 1, 2, 3].map((dato) => (
                <div key={dato} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
              ))}
            </div>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </Marco>
    );
  }

  const indicadores = indicadoresTiempos(tiempos.datos.resumen);
  const nombre = resumen.datos.proyecto.nombre;

  return (
    <Marco>
      <Card>
        <CardHeader className="flex-col items-start gap-1">
          <CardTitle>Tiempo por etapa</CardTitle>
          <CardDescription>{subtituloTiempos(tiempos.datos.despliegues.length, nombre)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Datos indicadores={indicadores} />
          <GraficaEtapas
            despliegues={tiempos.datos.despliegues}
            numeroActivo={resumen.datos.activo?.numero ?? null}
            medianaMs={tiempos.datos.resumen.medianaMs}
          />
        </CardContent>
      </Card>
    </Marco>
  );
}

function Marco({ children }: { children: ReactNode }) {
  return <div className="px-8 pt-6">{children}</div>;
}

function Datos({ indicadores }: { indicadores: IndicadoresTiempos }) {
  return (
    <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Dato etiqueta="Mediana" valor={indicadores.mediana} />
      <Dato etiqueta="Construcción" valor={indicadores.construccion} />
      <Dato etiqueta="Fallos" valor={indicadores.fallos} />
      <Dato etiqueta="Reversión" valor={indicadores.reversion} />
    </dl>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="font-mono text-xl tnum">{valor}</dd>
    </div>
  );
}
