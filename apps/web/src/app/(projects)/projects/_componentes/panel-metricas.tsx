"use client";

import { CircleStop, Cpu, MemoryStick } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { ErrorConexionApi } from "@/components/estados/error-conexion-api";
import { EstadoUsoBadge } from "@/components/deploya/graficas/estado-uso";
import { GraficaUso } from "@/components/deploya/graficas/grafica-uso";
import { PuntoVivo } from "@/components/deploya/punto-vivo";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetricas } from "@/hooks/use-metricas";
import { useMiSuscripcion } from "@/hooks/use-suscripcion";
import { rutaDespliegue } from "@/lib/despliegues";
import {
  mostrarErrorDeMetricas,
  vistaMetricas,
  type RangoMetricas,
  type UsoRecurso,
  type VistaMetricas,
} from "@/lib/metricas";
import { esFalloDeConexion } from "@/lib/reintento";

const DIVISIONES_CPU = 2;
const DIVISIONES_MEMORIA = 4;

/** Pantalla 16 · Métricas del proyecto (SP-10): pide la API, elige la ventana y pinta. */
export function PanelMetricas({ proyectoId }: { proyectoId: string }) {
  const [rango, setRango] = useState<RangoMetricas>("24h");
  const { datos, error, cargando, leidoEn, recargar } = useMetricas(proyectoId, rango);
  const suscripcion = useMiSuscripcion();
  const enVivo = !error && (datos === null || datos.aviso === null);

  let contenido: ReactNode;
  if (mostrarErrorDeMetricas(datos, error)) {
    contenido = esFalloDeConexion(error.estado) ? (
      <ErrorConexionApi error={error} ruta={`/proyectos/${proyectoId}/metricas?rango=${rango}`} onReintentar={recargar} />
    ) : (
      <Banner
        variant="bad"
        title="No pudimos cargar las métricas"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={recargar}>
            Reintentar
          </Button>
        }
      >
        {error.message}
      </Banner>
    );
  } else if (cargando || !datos || !leidoEn) {
    contenido = <Cargando />;
  } else if (datos.aviso !== null) {
    contenido = <SinDatos mensaje={datos.aviso} />;
  } else {
    const vista = vistaMetricas(datos, suscripcion.datos?.plan.nombre ?? null, rango, new Date(leidoEn));
    contenido = <Contenido vista={vista} proyectoId={proyectoId} rango={rango} esperandoPlan={suscripcion.cargando} />;
  }

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<RangoMetricas>
          value={rango}
          onValueChange={setRango}
          aria-label="Rango de las métricas"
          options={[
            { value: "1h", label: "1 h" },
            { value: "24h", label: "24 h" },
          ]}
        />
        {enVivo ? (
          <span className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <PuntoVivo />
            En vivo · una muestra por minuto
          </span>
        ) : null}
      </div>
      {contenido}
    </div>
  );
}

function Contenido({
  vista,
  proyectoId,
  rango,
  esperandoPlan,
}: {
  vista: VistaMetricas;
  proyectoId: string;
  rango: RangoMetricas;
  /** El nombre del plan llega después: esperar evita «del plan» y luego «de Starter». */
  esperandoPlan: boolean;
}) {
  if (!vista.memoria || !vista.cpu) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Sin muestras todavía.</CardContent>
      </Card>
    );
  }

  return (
    <>
      {vista.banner && !esperandoPlan ? (
        <Banner
          variant="warn"
          title={vista.banner.titulo}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {vista.comparacion ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={rutaDespliegue(proyectoId, vista.comparacion.actual)}>{vista.comparacion.etiqueta}</Link>
                </Button>
              ) : null}
              <Button asChild size="sm">
                <Link href="/planes">Cambiar plan</Link>
              </Button>
            </div>
          }
        >
          {vista.banner.cuerpo}
        </Banner>
      ) : null}

      <Leyenda />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TarjetaUso
          uso={vista.memoria}
          serie={vista.series.memoria}
          limite={vista.limiteMemoria}
          unidad="MB"
          divisiones={DIVISIONES_MEMORIA}
          despliegues={vista.eventos}
          ventana={vista.ventana}
          rango={rango}
          detalle={vista.memoria.delta?.texto ?? null}
          linea={vista.promedios}
        />
        <TarjetaUso
          uso={vista.cpu}
          serie={vista.series.cpu}
          limite={vista.limiteCpu}
          unidad="vCPU"
          divisiones={DIVISIONES_CPU}
          despliegues={vista.eventos}
          ventana={vista.ventana}
          rango={rango}
          detalle={vista.picoCpu}
          linea={vista.fraseCpu}
        />
      </div>
    </>
  );
}

function TarjetaUso({
  uso,
  serie,
  limite,
  unidad,
  divisiones,
  despliegues,
  ventana,
  rango,
  detalle,
  linea,
}: {
  uso: UsoRecurso;
  serie: { tiempo: string; valor: number }[];
  limite: number;
  unidad: string;
  divisiones: number;
  despliegues: { en: string; version: number }[];
  ventana: { inicio: string; fin: string };
  rango: RangoMetricas;
  detalle: string | null;
  linea: string | null;
}) {
  const Icono = uso.recurso === "memoria" ? MemoryStick : Cpu;
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Icono className="size-4 text-muted-foreground" aria-hidden />
        <CardTitle className="grow">{uso.titulo}</CardTitle>
        <EstadoUsoBadge estado={uso.estado} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em] tnum">{uso.porcentaje} %</span>
          <span className="font-mono text-sm tnum text-muted-foreground">
            {uso.cifra} {uso.unidad} de {uso.limite}
          </span>
        </div>
        {detalle ? <p className="font-mono text-xs tnum text-muted-foreground">{detalle}</p> : null}
        {linea ? <p className="text-xs text-muted-foreground">{linea}</p> : null}
        <GraficaUso
          titulo={uso.titulo}
          muestras={serie}
          limite={limite}
          unidad={unidad}
          divisiones={divisiones}
          inicio={ventana.inicio}
          fin={ventana.fin}
          rango={rango}
          despliegues={despliegues}
          mostrarTitulo={false}
        />
      </CardContent>
    </Card>
  );
}

function Leyenda() {
  return (
    <ul aria-label="Leyenda de la gráfica" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <li className="flex items-center gap-2">
        <span aria-hidden className="h-0.5 w-5 rounded-full bg-foreground" />
        Uso
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="w-5 border-t border-dashed border-muted-foreground" />
        Límite del plan
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="h-2 w-5 rounded-sm border-y border-dashed border-warn bg-warn/10" />
        Zona de aviso
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="h-3 border-l border-dashed border-foreground" />
        Despliegue
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="size-2 rounded-full bg-signal" />
        Ahora
      </li>
    </ul>
  );
}

function SinDatos({ mensaje }: { mensaje: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <CircleStop className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{mensaje}</p>
      </CardContent>
    </Card>
  );
}

function Cargando() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Cargando métricas">
      <Skeleton className="h-6 w-2/3" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
