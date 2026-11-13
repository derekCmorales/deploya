"use client";

import { ArrowRight, LoaderCircle, Rocket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import { useMiSuscripcion } from "@/hooks/use-suscripcion";
import { useProyectos } from "@/hooks/use-proyectos";
import { esUltimoPaso, indicePaso, textoProgreso } from "@/lib/alta";
import { rutaDespliegue } from "@/lib/despliegues";
import { contadorProyectos, puedeCrearProyecto } from "@/lib/proyectos";
import { avisoEstado, RUTA_SUSCRIPCION, sinVigencia } from "@/lib/suscripcion";

import { LateralAlta } from "./lateral-alta";
import { PasoConstruccion } from "./paso-construccion";
import { PasoDatos } from "./paso-datos";
import { PasoRepositorio } from "./paso-repositorio";
import { PasoRevisar } from "./paso-revisar";
import { PasoVariables } from "./paso-variables";

/**
 * Container del asistente «Nuevo proyecto» en cinco pasos (11a → 11d, con 11e; feat/m3-alta-guiada):
 * Repositorio, Construcción, Datos, Variables y Revisar. El despliegue #1 sale con todo.
 */
export function AsistenteAlta() {
  const router = useRouter();
  const alta = useAltaProyecto();
  const { datos: lista } = useProyectos({ sondear: false });
  const suscripcion = useMiSuscripcion();
  const sinCupo = lista !== null && !puedeCrearProyecto(lista);
  const sinVigenciaActual = suscripcion.datos ? sinVigencia(suscripcion.datos.estado) : false;
  const aviso = suscripcion.datos ? avisoEstado(suscripcion.datos.estado) : null;
  const indice = indicePaso(alta.paso);
  const ultimo = esUltimoPaso(alta.paso);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!ultimo) return alta.continuar();
    const creado = await alta.desplegar();
    if (creado) router.push(rutaDespliegue(creado.id, creado.numero));
  };

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
      <LateralAlta actual={indice} lista={lista} />
      <form onSubmit={enviar} className="flex min-w-0 flex-col" noValidate aria-busy={alta.ocupado}>
        <div className="flex w-full max-w-[860px] flex-1 flex-col gap-6 px-4 py-8 sm:px-8 lg:px-12">
          {sinVigenciaActual && aviso ? (
            <Banner
              variant="bad"
              title={aviso.titulo}
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link href={RUTA_SUSCRIPCION}>Renovar</Link>
                </Button>
              }
            >
              {aviso.texto}
            </Banner>
          ) : null}
          {sinCupo && lista ? (
            <Banner
              variant="warn"
              title="Llegaste al límite de tu plan"
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link href={RUTA_SUSCRIPCION}>Cambiar plan</Link>
                </Button>
              }
            >
              {contadorProyectos(lista)}. Cambia de plan para crear otro proyecto.
            </Banner>
          ) : null}
          {alta.paso === "repositorio" ? <PasoRepositorio alta={alta} /> : null}
          {alta.paso === "construccion" ? <PasoConstruccion alta={alta} /> : null}
          {alta.paso === "datos" ? <PasoDatos alta={alta} lista={lista} /> : null}
          {alta.paso === "variables" ? <PasoVariables alta={alta} /> : null}
          {alta.paso === "revisar" ? <PasoRevisar alta={alta} lista={lista} /> : null}
        </div>
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background px-4 py-4 sm:px-8 lg:px-12">
          <span className="flex-1 text-xs text-muted-foreground">
            {textoProgreso(alta.paso)}
          </span>
          {alta.paso === "repositorio" ? (
            <Button asChild variant="ghost">
              <Link href="/projects">Cancelar</Link>
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={alta.volver}>
              Atrás
            </Button>
          )}
          <Button type="submit" disabled={alta.ocupado || sinCupo || sinVigenciaActual}>
            {alta.ocupado ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
            {ultimo ? (
              <>
                {alta.ocupado ? null : <Rocket />}
                Desplegar
              </>
            ) : (
              <>
                Continuar
                {alta.ocupado ? null : <ArrowRight />}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
