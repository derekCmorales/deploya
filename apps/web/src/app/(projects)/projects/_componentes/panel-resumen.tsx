"use client";

import { Container, GitCommitHorizontal, Package, Waypoints, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { LineaTiempo } from "@/components/deploya/linea-tiempo";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumen } from "@/hooks/use-resumen";
import { ESQUEMA_APPS } from "@/lib/api";
import { rutaDespliegue } from "@/lib/despliegues";
import { duracionFila, fechaFila, digestCorto } from "@/lib/historial";
import { shaCorto, textoEtapa, type VistaDespliegue } from "@/lib/proyectos";
import {
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

import { AccionesContenedor } from "./acciones-contenedor";

const ICONO_HITO: Record<string, LucideIcon> = {
  recepcion: GitCommitHorizontal,
  construccion: Package,
  ejecucion: Container,
  enrutamiento: Waypoints,
};

/** Pantalla 13: estado actual, versión activa, recursos del plan y línea de tiempo del último despliegue. */
export function PanelResumen({ proyectoId }: { proyectoId: string }) {
  const [origen, setOrigen] = useState<string | null>(null);
  const { datos, error, cargando, recargar } = useResumen(proyectoId, origen);
  const ahora = useReloj();
  const [actualizado, setActualizado] = useState(() => Date.now());
  useEffect(() => {
    if (datos) setActualizado(Date.now());
  }, [datos]);

  if (error && !datos) return <Banner variant="bad" title="No pudimos cargar el resumen">{error.message}</Banner>;
  if (cargando || !datos) return <Cargando />;

  const alAccionar = () => {
    setOrigen(datos.activo?.estado ?? null);
    recargar();
  };
  return (
    <div className="flex flex-col gap-6 px-8 py-6">
      <div className="flex flex-wrap items-start justify-end gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/projects/${proyectoId}/configuracion`}>Cambiar rama</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/projects/${proyectoId}/configuracion#zona-de-peligro`}>Eliminar proyecto</Link>
        </Button>
        {datos.activo ? <AccionesContenedor proyectoId={proyectoId} estado={datos.activo.estado} alAccionar={alAccionar} /> : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <EstadoActual resumen={datos} actualizado={textoActualizado(actualizado, ahora)} />
          <VersionActiva activo={datos.activo} ahora={new Date(ahora)} />
        </div>
        <div className="flex flex-col gap-6">
          <Recursos resumen={datos} />
          <UltimoDespliegue resumen={datos} />
        </div>
      </div>
    </div>
  );
}

function EstadoActual({ resumen, actualizado }: { resumen: ResumenProyecto; actualizado: string }) {
  const despliegue = resumen.ultimo;
  return (
    <Card>
      <CardHeader className="justify-between">
        <CardTitle>Estado actual</CardTitle>
        <span className="text-xs text-muted-foreground">{actualizado}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
        {resumen.proyecto.url ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">URL pública</span>
            <CopyField value={resumen.proyecto.url} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function VersionActiva({ activo, ahora }: { activo: VistaDespliegue | null; ahora: Date }) {
  if (!activo) return null;
  const imagen = activo.imagen;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Versión activa</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold tracking-[-0.02em]">#{activo.numero}</span>
          {activo.commit ? (
            <span className="text-muted-foreground">
              {activo.commit.mensaje}
              <span className="font-mono text-xs"> · {shaCorto(activo.commit.sha)}</span>
            </span>
          ) : null}
        </div>
        {imagen ? (
          <Dato titulo="Imagen" valor={digestCorto(imagen.digest)} mono detalle={detalleImagen(imagen, textoConstruccion(activo))} />
        ) : null}
        {activo.terminado ? (
          <Dato
            titulo="Publicada"
            valor={fechaFila(activo.terminado, ahora)}
            detalle={activo.commit?.autor ? `por ${activo.commit.autor}` : undefined}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function Recursos({ resumen }: { resumen: ResumenProyecto }) {
  return (
    <Card>
      <CardHeader className="justify-between">
        <CardTitle>Recursos aplicados</CardTitle>
        <Badge variant="outline">{resumen.plan.nombre}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <dl className="grid grid-cols-3 gap-3">
          <Dato titulo="CPU" valor={resumen.recursos ? textoCpu(resumen.recursos.cpus) : "—"} />
          <Dato titulo="Memoria" valor={resumen.recursos ? textoMemoria(resumen.recursos.memoriaMb) : "—"} />
          <Dato titulo="Puerto" valor={textoPuerto(resumen.proyecto.puertoInterno, ESQUEMA_APPS)} />
        </dl>
        <p className="text-xs text-muted-foreground">
          Aplicados con <code className="font-mono">--cpus</code> y <code className="font-mono">--memory</code> de Docker.
        </p>
      </CardContent>
    </Card>
  );
}

function UltimoDespliegue({ resumen }: { resumen: ResumenProyecto }) {
  const ultimo = resumen.ultimo;
  if (!ultimo) return null;
  const total = duracionTotalMs(ultimo);
  return (
    <Card>
      <CardHeader className="justify-between">
        <CardTitle>
          <Link href={rutaDespliegue(resumen.proyecto.id, ultimo.numero)} className="hover:underline">
            Último despliegue · #{ultimo.numero}
          </Link>
        </CardTitle>
        {total !== null ? <span className="tnum text-xs text-muted-foreground">{duracionFila(total)}</span> : null}
      </CardHeader>
      <CardContent>
        <LineaTiempo items={resumen.lineaTiempo.map(itemDe)} />
      </CardContent>
    </Card>
  );
}

function itemDe(hito: HitoLineaTiempo) {
  return { icono: ICONO_HITO[hito.etapa] ?? Package, titulo: hito.titulo, detalle: hito.detalle, hora: horaHito(hito.marca) };
}

function Dato({ titulo, valor, detalle, mono }: { titulo: string; valor: string; detalle?: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className={mono ? "font-mono text-[13px]" : "font-medium"}>{valor}</dd>
      {detalle ? <dd className="text-xs text-muted-foreground">{detalle}</dd> : null}
    </div>
  );
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
