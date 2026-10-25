"use client";

import Link from "next/link";

import { EstadoUsoBadge } from "@/components/deploya/graficas/estado-uso";
import { GraficaUso } from "@/components/deploya/graficas/grafica-uso";
import { PuntoVivo } from "@/components/deploya/punto-vivo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetricas } from "@/hooks/use-metricas";
import { mostrarErrorDeMetricas, vistaResumen, type UsoRecurso } from "@/lib/metricas";

const DIVISIONES_CPU = 2;
const DIVISIONES_MEMORIA = 4;

/** Tarjeta 13c · Últimas 24 h en el Resumen, debajo de Actividad y Último despliegue (SP-11). */
export function TarjetaUltimas24h({ proyectoId }: { proyectoId: string }) {
  const { datos, error, cargando, leidoEn, recargar } = useMetricas(proyectoId, "24h");

  if (cargando) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  if (mostrarErrorDeMetricas(datos, error)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="grow">Últimas 24 h</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">No pudimos cargar las últimas 24 h.</p>
          <Button type="button" variant="outline" size="sm" onClick={recargar}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!datos || !leidoEn) return null;
  const vista = vistaResumen(datos, new Date(leidoEn));
  if (!vista) return null;
  const { memoria, cpu } = vista;

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <CardTitle className="grow">Últimas 24 h</CardTitle>
        {!error ? (
          <Badge variant="signal">
            <PuntoVivo />
            En vivo
          </Badge>
        ) : null}
        <Button asChild variant="ghost" size="xs">
          <Link href={`/projects/${proyectoId}/metricas`}>Ver métricas</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {cpu && memoria ? (
          <>
            <FilaUso
              uso={cpu}
              serie={vista.series.cpu}
              limite={vista.limiteCpu}
              unidad="vCPU"
              divisiones={DIVISIONES_CPU}
              ventana={vista.ventana}
            />
            <FilaUso
              uso={memoria}
              serie={vista.series.memoria}
              limite={vista.limiteMemoria}
              unidad="MB"
              divisiones={DIVISIONES_MEMORIA}
              ventana={vista.ventana}
            />
          </>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin muestras todavía.</p>
        )}
      </CardContent>
    </Card>
  );
}

function FilaUso({
  uso,
  serie,
  limite,
  unidad,
  divisiones,
  ventana,
}: {
  uso: UsoRecurso;
  serie: { tiempo: string; valor: number }[];
  limite: number;
  unidad: string;
  divisiones: number;
  ventana: { inicio: string; fin: string };
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{uso.titulo}</span>
        <span className="font-mono text-sm tnum">{uso.porcentaje} %</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs tnum text-muted-foreground">
          {uso.cifra} de {uso.limite}
        </span>
        <EstadoUsoBadge estado={uso.estado} />
      </div>
      {uso.delta ? <p className="font-mono text-[11px] tnum text-muted-foreground">{uso.delta.texto}</p> : null}
      <GraficaUso
        compacta
        titulo={uso.titulo}
        muestras={serie}
        limite={limite}
        unidad={unidad}
        divisiones={divisiones}
        inicio={ventana.inicio}
        fin={ventana.fin}
        rango="24h"
      />
    </div>
  );
}
