"use client";

import { useCallback } from "react";

import { ErrorConexionApi } from "@/components/estados/error-conexion-api";
import { GraficaEtapas } from "@/components/deploya";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumen } from "@/hooks/use-resumen";
import { useTiempos } from "@/hooks/use-tiempos";
import { esFalloDeConexion } from "@/lib/reintento";
import { consultaTiempos, indicadoresTiempos, type IndicadoresTiempos } from "@/lib/tiempos";

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

  if (tiempos.datos.despliegues.length === 0) return null;

  const indicadores = indicadoresTiempos(tiempos.datos.resumen);
  const nombre = resumen.datos.proyecto.nombre;

  return (
    <Marco>
      <Card>
        <CardHeader className="flex-col items-start gap-1">
          <CardTitle>Tiempo por etapa</CardTitle>
          <CardDescription>Últimos 14 despliegues de {nombre}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Datos indicadores={indicadores} />
          <GraficaEtapas
            despliegues={tiempos.datos.despliegues}
            numeroActivo={resumen.datos.activo?.numero ?? null}
          />
          <p className="font-mono text-[11px] text-muted-foreground">
            Pasa el cursor por una columna para ver cada etapa. La construcción es lo que más pesa: un Dockerfile con
            caché de dependencias la acorta.
          </p>
        </CardContent>
      </Card>
    </Marco>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
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
