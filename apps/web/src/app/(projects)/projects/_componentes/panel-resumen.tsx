"use client";

import { Container, Cpu, ExternalLink, GitCommitHorizontal, Lock, MemoryStick, Network, Package, Waypoints, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { LineaTiempo } from "@/components/deploya/linea-tiempo";
import { Skeleton } from "@/components/ui/skeleton";
import { publicarEstadoActivo } from "@/hooks/use-estado-activo";
import { useResumen } from "@/hooks/use-resumen";
import { ESQUEMA_APPS } from "@/lib/api";
import { rutaDespliegue } from "@/lib/despliegues";
import { duracionFila, fechaFila, digestCorto } from "@/lib/historial";
import { shaCorto, textoEtapa, type VistaDespliegue } from "@/lib/proyectos";
import {
  EVENTO_ACCION_CONTENEDOR,
  detalleImagen,
  duracionConstruccion,
  duracionTotalMs,
  horaHito,
  textoActualizado,
  textoCpu,
  textoMemoria,
  textoPuerto,
  type HitoLineaTiempo,
  type ResumenProyecto,
} from "@/lib/resumen";

const ICONO_HITO: Record<string, LucideIcon> = {
  recepcion: GitCommitHorizontal,
  construccion: Package,
  ejecucion: Container,
  enrutamiento: Waypoints,
};

/**
 * Pantalla 13: estado actual con la versión activa, recursos del plan y línea de tiempo del último despliegue.
 * «Reiniciar» y «Detener» van en la cabecera (`MarcoProyecto`): este panel le publica el estado del activo.
 */
export function PanelResumen({ proyectoId }: { proyectoId: string }) {
  const [origen, setOrigen] = useState<string | null>(null);
  const { datos, error, cargando, recargar } = useResumen(proyectoId, origen);
  const ahora = useReloj();
  const [actualizado, setActualizado] = useState(() => Date.now());
  useEffect(() => {
    if (datos) setActualizado(Date.now());
  }, [datos]);
  useAccionesDeCabecera(datos, setOrigen, recargar);

  if (error && !datos) return <Banner variant="bad" title="No pudimos cargar el resumen">{error.message}</Banner>;
  if (cargando || !datos) return <Cargando />;

  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex flex-wrap items-stretch gap-6">
        <EstadoActual resumen={datos} actualizado={textoActualizado(actualizado, ahora)} ahora={new Date(ahora)} />
        <Recursos resumen={datos} />
      </div>
      <div className="flex flex-wrap items-stretch gap-6">
        <UltimoDespliegue resumen={datos} />
      </div>
    </div>
  );
}

/** Publica el estado del activo para la cabecera y, cuando ella reinicia o detiene, sigue sondeando. */
function useAccionesDeCabecera(datos: ResumenProyecto | null, setOrigen: (estado: string | null) => void, recargar: () => void) {
  const estado = datos?.activo?.estado ?? null;
  const estadoActual = useRef(estado);
  estadoActual.current = estado;
  useEffect(() => {
    publicarEstadoActivo(estado);
  }, [estado]);
  useEffect(() => () => publicarEstadoActivo(null), []);
  useEffect(() => {
    const alAccionar = () => {
      setOrigen(estadoActual.current);
      recargar();
    };
    window.addEventListener(EVENTO_ACCION_CONTENEDOR, alAccionar);
    return () => window.removeEventListener(EVENTO_ACCION_CONTENEDOR, alAccionar);
  }, [setOrigen, recargar]);
}

function EstadoActual({ resumen, actualizado, ahora }: { resumen: ResumenProyecto; actualizado: string; ahora: Date }) {
  const despliegue = resumen.ultimo;
  const url = resumen.proyecto.url;
  return (
    <Card className="flex min-w-[min(100%,560px)] flex-[2_1_0] flex-col">
      <CardHeader>
        <CardTitle className="grow">Estado actual</CardTitle>
        <span className="text-xs text-muted-foreground">{actualizado}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-4">
          {url ? (
            <div className="flex min-w-0 grow flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">URL pública</span>
              <div className="flex items-center gap-2">
                <CopyField
                  value={url}
                  prefijo={url.startsWith("https://") ? <Lock className="text-ok" aria-hidden /> : undefined}
                  className="w-[420px] max-w-full"
                />
                <Button asChild variant="outline" size="icon-sm">
                  <a href={url} target="_blank" rel="noreferrer" aria-label="Abrir en otra pestaña">
                    <ExternalLink />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <span className="grow" />
          )}
          {resumen.activo ? <EstadoDespliegue estado={resumen.activo.estado} size="lg" /> : null}
        </div>
        {despliegue ? (
          <RielEtapas
            size="lg"
            etapas={despliegue.etapas.map((etapa) => etapa.estado)}
            detalle={despliegue.etapas.map((etapa) => ({
              duracion: textoEtapa(etapa.nombre, etapa.estado, etapa.duracionMs, despliegue.estado === "saludable"),
            }))}
            saludable={despliegue.estado === "saludable"}
          />
        ) : (
          <RielEtapas size="lg" etapas={["pendiente", "pendiente", "pendiente", "pendiente", "pendiente"]} />
        )}
      </CardContent>
      {resumen.activo ? <VersionActiva activo={resumen.activo} ahora={ahora} /> : null}
    </Card>
  );
}

/** Las tres celdas al pie de «Estado actual»: versión activa, imagen y publicación. */
function VersionActiva({ activo, ahora }: { activo: VistaDespliegue; ahora: Date }) {
  const imagen = activo.imagen;
  return (
    <dl className="mt-auto grid grid-cols-1 border-t border-border sm:grid-cols-3 sm:[&>div+div]:border-l [&>div+div]:border-border">
      <div className="flex flex-col gap-1.5 p-4">
        <dt className="text-xs text-muted-foreground">Versión activa</dt>
        <dd className="flex items-center gap-2">
          <span className="font-mono font-medium">#{activo.numero}</span>
          {activo.commit ? <span className="font-mono text-xs text-muted-foreground">{shaCorto(activo.commit.sha)}</span> : null}
        </dd>
        {activo.commit ? <dd className="text-sm">{activo.commit.mensaje}</dd> : null}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <dt className="text-xs text-muted-foreground">Imagen</dt>
        <dd className="font-mono text-[13px]">{imagen ? digestCorto(imagen.digest) : "—"}</dd>
        {imagen ? <dd className="text-xs text-muted-foreground">{detalleImagen(imagen, textoConstruccion(activo))}</dd> : null}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <dt className="text-xs text-muted-foreground">Publicada</dt>
        <dd className="font-medium">{activo.terminado ? fechaFila(activo.terminado, ahora) : "—"}</dd>
        {activo.commit?.autor ? <dd className="text-xs text-muted-foreground">por {activo.commit.autor}</dd> : null}
      </div>
    </dl>
  );
}

function Recursos({ resumen }: { resumen: ResumenProyecto }) {
  return (
    <Card className="flex min-w-[260px] flex-[1_1_0] flex-col">
      <CardHeader>
        <CardTitle className="grow">Recursos aplicados</CardTitle>
        <Badge variant="outline">{resumen.plan.nombre}</Badge>
      </CardHeader>
      <CardContent className="flex grow flex-col gap-4 text-sm">
        <Recurso icono={Cpu} titulo="CPU" valor={resumen.recursos ? textoCpu(resumen.recursos.cpus) : "—"} />
        <Recurso icono={MemoryStick} titulo="Memoria" valor={resumen.recursos ? textoMemoria(resumen.recursos.memoriaMb) : "—"} />
        <Recurso icono={Network} titulo="Puerto" valor={textoPuerto(resumen.proyecto.puertoInterno, ESQUEMA_APPS)} />
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Aplicados con <code className="font-mono">--cpus</code> y <code className="font-mono">--memory</code> de Docker.
        </p>
      </CardFooter>
    </Card>
  );
}

function Recurso({ icono: Icono, titulo, valor }: { icono: LucideIcon; titulo: string; valor: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icono className="size-4 text-muted-foreground" aria-hidden />
      <span className="grow text-muted-foreground">{titulo}</span>
      <span className="font-mono">{valor}</span>
    </div>
  );
}

function UltimoDespliegue({ resumen }: { resumen: ResumenProyecto }) {
  const ultimo = resumen.ultimo;
  if (!ultimo) return null;
  const total = duracionTotalMs(ultimo);
  return (
    <Card className="flex min-w-[min(100%,360px)] flex-[1_1_0] flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>
          <Link href={rutaDespliegue(resumen.proyecto.id, ultimo.numero)} className="hover:underline">
            Último despliegue · #{ultimo.numero}
          </Link>
        </CardTitle>
        {total !== null ? <span className="tnum font-mono text-xs text-muted-foreground">{duracionFila(total)}</span> : null}
      </div>
      <LineaTiempo items={resumen.lineaTiempo.map(itemDe)} />
    </Card>
  );
}

function itemDe(hito: HitoLineaTiempo) {
  return { icono: ICONO_HITO[hito.etapa] ?? Package, titulo: hito.titulo, detalle: hito.detalle, hora: horaHito(hito.marca) };
}

function Cargando() {
  return (
    <div className="flex flex-col gap-4 px-8 py-6" aria-busy="true" aria-label="Cargando resumen">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function textoConstruccion(activo: VistaDespliegue): string | null {
  const ms = duracionConstruccion(activo);
  return ms === null ? null : duracionFila(ms);
}

/** Reloj de un segundo para «Actualizado hace N s». */
function useReloj(): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}
