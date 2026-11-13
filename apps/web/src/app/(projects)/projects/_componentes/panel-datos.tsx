"use client";

import { Database, Plus } from "lucide-react";
import Link from "next/link";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";
import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { useDatosProyecto, type DatosProyecto } from "@/hooks/use-datos-proyecto";
import { useProyectos } from "@/hooks/use-proyectos";
import { useMiSuscripcion } from "@/hooks/use-suscripcion";
import {
  DESCRIPCION_TIPO,
  limiteAlcanzado,
  opcionesCrear,
  textoLimite,
  textoMotivo,
  type ListaRecursosDatos,
  type OpcionCrear,
  type TipoRecurso,
} from "@/lib/datos";
import { avisoEstado, sinVigencia } from "@/lib/suscripcion";

import { BannerBloqueo } from "./banner-bloqueo";
import { ICONO_TIPO } from "./iconos-datos";
import { TarjetaRecursoDatos } from "./tarjeta-recurso-datos";

export const TEXTO_VACIO_DATOS =
  "Agrega una base de datos administrada: PostgreSQL con pgvector, Redis o almacenamiento S3. Sus datos sobreviven a redespliegues y reversiones.";

/** Código que `BannerBloqueo` reconoce para «Renovar» (mismo bloqueo que los despliegues). */
const CODIGO_BLOQUEO = "suscripcion-no-permite";

/** Pestaña Datos (ficha 18): bases administradas del proyecto, propias y compartidas. */
export function PanelDatos({ proyectoId }: { proyectoId: string }) {
  const datos = useDatosProyecto(proyectoId);
  const proyectos = useProyectos({ sondear: false });
  const suscripcion = useMiSuscripcion();
  const bloqueada = suscripcion.datos ? sinVigencia(suscripcion.datos.estado) : false;
  const aviso = suscripcion.datos ? avisoEstado(suscripcion.datos.estado) : null;

  if (datos.errorCarga && !datos.datos) {
    return (
      <div className="px-4 sm:px-8 py-6">
        <Banner variant="bad" title="No pudimos cargar las bases de datos">
          {datos.errorCarga.message}
        </Banner>
      </div>
    );
  }
  if (datos.cargando || !datos.datos) return <Cargando />;
  const lista = datos.datos;

  return (
    <div className="flex max-w-[1040px] flex-col gap-6 px-4 sm:px-8 py-6">
      {bloqueada && aviso ? <BannerBloqueo codigo={CODIGO_BLOQUEO} mensaje={aviso.texto} /> : null}
      <ErrorAccion datos={datos} />
      <Cabecera lista={lista} />
      <Crear opciones={opcionesCrear(lista)} ocupado={datos.ocupado} bloqueada={bloqueada} onCrear={datos.crear} />
      {lista.recursos.length === 0 ? (
        <Card>
          <CardContent className="flex items-start gap-3 pt-4">
            <Database className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">{TEXTO_VACIO_DATOS}</p>
          </CardContent>
        </Card>
      ) : (
        <section aria-label="Bases de datos conectadas" className="flex flex-col gap-4">
          {lista.recursos.map((recurso) => (
            <TarjetaRecursoDatos
              key={recurso.id}
              proyectoId={proyectoId}
              recurso={recurso}
              datos={datos}
              proyectos={proyectos.datos?.proyectos ?? []}
              desplegarBloqueado={bloqueada}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function Cabecera({ lista }: { lista: ListaRecursosDatos }) {
  const lleno = limiteAlcanzado(lista.limite);
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em]">Bases de datos</h2>
        <p className="text-sm text-muted-foreground">Sus datos sobreviven a redespliegues, reversiones y reinicios de la app.</p>
      </div>
      <div className="flex w-[280px] max-w-full flex-col gap-1.5">
        {lista.limite.maximo === null ? (
          <p className="text-sm text-muted-foreground">{textoLimite(lista.limite)}</p>
        ) : (
          <Meter
            label="Bases de datos del plan"
            value={lista.limite.usados}
            max={lista.limite.maximo}
            valueLabel={textoLimite(lista.limite)}
            tonoAlLimite="warn"
          />
        )}
        {lleno ? (
          <Link href={RUTA_PLANES} className="self-end text-xs font-medium underline underline-offset-4 hover:text-foreground">
            Ver planes
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Crear({
  opciones,
  ocupado,
  bloqueada,
  onCrear,
}: {
  opciones: OpcionCrear[];
  ocupado: boolean;
  bloqueada: boolean;
  onCrear: (tipo: TipoRecurso) => Promise<boolean>;
}) {
  if (opciones.length === 0) return null;
  return (
    <section aria-label="Agregar una base de datos" className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {opciones.map((opcion) => {
        const Icono = ICONO_TIPO[opcion.tipo];
        const { nombre, descripcion } = DESCRIPCION_TIPO[opcion.tipo];
        return (
          <Card key={opcion.tipo} className="flex flex-col" data-deshabilitada={opcion.habilitada ? undefined : "true"}>
            <CardHeader>
              <Icono className="size-[18px] text-muted-foreground" aria-hidden />
              <CardTitle>{nombre}</CardTitle>
            </CardHeader>
            <CardContent className="grow">
              <CardDescription className="text-xs">{descripcion}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!opcion.habilitada || ocupado || bloqueada}
                onClick={() => void onCrear(opcion.tipo)}
                aria-label={`Agregar ${nombre}`}
              >
                <Plus />
                Agregar
              </Button>
              {opcion.motivo ? <span className="text-xs text-muted-foreground">{textoMotivo(opcion.motivo)}</span> : null}
            </CardFooter>
          </Card>
        );
      })}
    </section>
  );
}

/** 409 del contrato con su explicación; la suscripción bloqueada reusa el banner de «Renovar». */
function ErrorAccion({ datos }: { datos: DatosProyecto }) {
  const error = datos.error;
  if (!error) return null;
  if (error.tipo === "bloqueo") return <BannerBloqueo codigo={CODIGO_BLOQUEO} mensaje={error.mensaje || error.titulo} />;
  const accion =
    error.tipo === "limite" ? (
      <Button asChild variant="outline" size="sm">
        <Link href={RUTA_PLANES}>Cambiar de plan</Link>
      </Button>
    ) : (
      <Button type="button" variant="ghost" size="sm" onClick={datos.limpiarError}>
        Cerrar
      </Button>
    );
  return (
    <Banner variant={error.tipo === "aviso" ? "bad" : "warn"} title={error.titulo} actions={accion}>
      {error.mensaje}
    </Banner>
  );
}

function Cargando() {
  return (
    <div className="flex max-w-[1040px] flex-col gap-4 px-4 sm:px-8 py-6" aria-busy="true" aria-label="Cargando bases de datos">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
