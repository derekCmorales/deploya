"use client";

import { ArrowRight, Plus, RotateCw } from "lucide-react";
import Link from "next/link";

import { ErrorConexionApi } from "@/components/estados/error-conexion-api";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useModoInstalacion } from "@/hooks/use-modo-instalacion";
import { useProyectos } from "@/hooks/use-proyectos";
import { useSesion } from "@/hooks/use-sesion";
import { useConsumoPeriodo, useMiSuscripcion } from "@/hooks/use-suscripcion";
import { hayCobro } from "@/lib/instalacion";
import { resumenEstados, RUTA_NUEVO_PROYECTO, saludo, textoResumenEstados } from "@/lib/inicio";
import { puedeCrearProyecto, type ListaProyectos } from "@/lib/proyectos";
import { esFalloDeConexion } from "@/lib/reintento";
import { avisoEstado, RUTA_SUSCRIPCION, rutaRenovar, sinVigencia, textoVencida, type MiSuscripcion } from "@/lib/suscripcion";

import { ActividadInicio } from "./actividad-inicio";
import { Bienvenida } from "./bienvenida";
import { MetricasInicio } from "./metricas-inicio";
import { ProyectosInicio } from "./proyectos-inicio";

/**
 * Pantalla 00 · Inicio (patrón C de la guía). Container: lee proyectos, suscripción y consumo,
 * y reparte a las secciones. Sin proyectos, la bienvenida guía el primer despliegue.
 */
export function PanelInicio() {
  const { usuario } = useSesion();
  const { modo } = useModoInstalacion();
  const cobro = hayCobro(modo);
  const { datos: lista, error, recargar } = useProyectos();
  const { datos: suscripcion } = useMiSuscripcion({ activo: cobro });
  const { datos: consumo } = useConsumoPeriodo();

  const bloqueada = suscripcion ? sinVigencia(suscripcion.estado) : false;
  const puedeCrear = !!lista && puedeCrearProyecto(lista) && !bloqueada;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col gap-6 px-4 pt-7 pb-10 sm:px-8">
      <header className="dy-entrada flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-medium text-muted-foreground">Inicio</p>
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">{saludo(usuario?.nombre)}</h1>
          {lista ? <Subtitulo lista={lista} /> : <Skeleton className="h-5 w-64" />}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/projects">
              Ver proyectos
              <ArrowRight />
            </Link>
          </Button>
          <BotonNuevoProyecto habilitado={puedeCrear} motivo={bloqueada ? "Renueva tu plan para crear proyectos." : "Llegaste al límite de proyectos de tu plan."} />
        </div>
      </header>

      {cobro && suscripcion ? <AvisoSuscripcion suscripcion={suscripcion} /> : null}
      {error && !lista ? <ErrorInicio error={error} onReintentar={recargar} /> : null}

      {lista && lista.proyectos.length === 0 ? <Bienvenida plan={lista.plan} puedeCrear={puedeCrear} /> : null}

      <MetricasInicio lista={lista} consumo={consumo} suscripcion={cobro ? suscripcion : null} cobro={cobro} />

      {!lista && !error ? <EsqueletoSecciones /> : null}
      {lista && lista.proyectos.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <ProyectosInicio lista={lista} />
          <ActividadInicio lista={lista} />
        </div>
      ) : null}
    </main>
  );
}

function Subtitulo({ lista }: { lista: ListaProyectos }) {
  const estados = textoResumenEstados(resumenEstados(lista));
  return (
    <p className="text-muted-foreground">
      Plan {lista.plan.nombre}
      {estados ? ` · ${estados}` : " · todavía no despliegas nada"}
    </p>
  );
}

function BotonNuevoProyecto({ habilitado, motivo }: { habilitado: boolean; motivo: string }) {
  if (!habilitado) {
    return (
      <>
        <Button disabled aria-describedby="motivo-nuevo-proyecto">
          <Plus />
          Nuevo proyecto
        </Button>
        <span id="motivo-nuevo-proyecto" className="sr-only">
          {motivo}
        </span>
      </>
    );
  }
  return (
    <Button asChild>
      <Link href={RUTA_NUEVO_PROYECTO}>
        <Plus />
        Nuevo proyecto
      </Link>
    </Button>
  );
}

/** Mismos avisos que 08 y 10c: vencida con gracia en `warn`, sin vigencia en `bad`. */
function AvisoSuscripcion({ suscripcion }: { suscripcion: MiSuscripcion }) {
  if (suscripcion.estado === "vencida") {
    const aviso = textoVencida(suscripcion);
    return (
      <Banner
        variant="warn"
        title={aviso.titulo}
        actions={
          <Button asChild size="sm">
            <Link href={rutaRenovar(suscripcion)}>Renovar</Link>
          </Button>
        }
      >
        {aviso.texto}
      </Banner>
    );
  }
  const aviso = avisoEstado(suscripcion.estado);
  if (!aviso) return null;
  return (
    <Banner
      variant="bad"
      title={aviso.titulo}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href={RUTA_SUSCRIPCION}>Ver suscripción</Link>
        </Button>
      }
    >
      {aviso.texto}
    </Banner>
  );
}

function ErrorInicio({ error, onReintentar }: { error: NonNullable<ReturnType<typeof useProyectos>["error"]>; onReintentar: () => void }) {
  if (esFalloDeConexion(error.estado)) return <ErrorConexionApi error={error} ruta="/proyectos" onReintentar={onReintentar} />;
  return (
    <Banner
      variant="bad"
      title="No pudimos cargar tu panel."
      actions={
        <Button variant="outline" size="sm" onClick={onReintentar}>
          <RotateCw />
          Reintentar
        </Button>
      }
    >
      {error.message}
    </Banner>
  );
}

function EsqueletoSecciones() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]" aria-busy aria-label="Cargando tu panel">
      <Skeleton className="h-[320px] w-full rounded-xl" />
      <Skeleton className="h-[320px] w-full rounded-xl" />
    </div>
  );
}
