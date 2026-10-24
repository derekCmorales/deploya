"use client";

import { Box, Ellipsis, ExternalLink, GitBranch, Globe, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound, usePathname } from "next/navigation";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { ErrorConexionApi } from "@/components/estados/error-conexion-api";
import { RielEtapas } from "@/components/deploya/riel-etapas";
import { TabsNav } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useEstadoActivo } from "@/hooks/use-estado-activo";
import { useProyectos } from "@/hooks/use-proyectos";
import { useMiSuscripcion } from "@/hooks/use-suscripcion";
import { DOMINIO_APPS, ESQUEMA_APPS } from "@/lib/api";
import { etapasDelRiel, urlProyecto, type ProyectoEnLista } from "@/lib/proyectos";
import { esFalloDeConexion } from "@/lib/reintento";
import { EVENTO_ACCION_CONTENEDOR, opcionesMasAcciones } from "@/lib/resumen";
import { sinVigencia } from "@/lib/suscripcion";

import { AccionesContenedor } from "./acciones-contenedor";
import { BotonDesplegar } from "./boton-desplegar";

/**
 * Cabecera y pestañas de 13–19: Resumen, Despliegues, Métricas, Variables y Configuración. Un proyecto que
 * no está en la lista es el 404 de 28; si la API no responde, el error de conexión de 28 (WEB-02).
 */
export function MarcoProyecto({ proyectoId }: { proyectoId: string }) {
  const ruta = usePathname();
  const { datos, error, recargar } = useProyectos({ sondear: false });
  const proyecto = datos?.proyectos.find((p) => p.id === proyectoId) ?? null;
  if (datos && !proyecto) notFound();
  const resumen = `/projects/${proyectoId}`;
  const despliegues = `/projects/${proyectoId}/despliegues`;
  const metricas = `/projects/${proyectoId}/metricas`;
  const variables = `/projects/${proyectoId}/variables`;
  const configuracion = `/projects/${proyectoId}/configuracion`;

  return (
    <header className="flex flex-col gap-4 border-b border-border px-8 pt-6">
      <nav aria-label="Ruta" className="flex items-center gap-2 font-mono text-[13px] text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground">
          proyectos
        </Link>
        <span className="text-faint" aria-hidden>
          /
        </span>
        <span className="text-foreground">{proyecto?.nombre ?? "…"}</span>
      </nav>
      {error && esFalloDeConexion(error.estado) ? <ErrorConexionApi error={error} ruta="/proyectos" onReintentar={recargar} /> : null}
      {proyecto ? <Identidad proyecto={proyecto} enResumen={ruta === resumen} /> : <Skeleton className="h-8 w-64" />}
      <TabsNav aria-label="Secciones del proyecto">
        <Link href={resumen} aria-current={ruta === resumen ? "page" : undefined}>
          Resumen
        </Link>
        <Link href={despliegues} aria-current={ruta === despliegues || ruta?.startsWith(`${despliegues}/`) ? "page" : undefined}>
          Despliegues
        </Link>
        <Link href={metricas} aria-current={ruta === metricas ? "page" : undefined}>
          Métricas
        </Link>
        <Link href={variables} aria-current={ruta === variables ? "page" : undefined}>
          Variables
        </Link>
        <Link href={configuracion} aria-current={ruta === configuracion ? "page" : undefined}>
          Configuración
        </Link>
      </TabsNav>
    </header>
  );
}

function Identidad({ proyecto, enResumen }: { proyecto: ProyectoEnLista; enResumen: boolean }) {
  const ultimo = proyecto.ultimoDespliegue;
  const url = urlProyecto(proyecto.subdominio, DOMINIO_APPS, ESQUEMA_APPS);
  const enLinea = ultimo?.estado === "saludable";
  const suscripcion = useMiSuscripcion();
  const bloqueada = suscripcion.datos ? sinVigencia(suscripcion.datos.estado) : false;
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">{proyecto.nombre}</h1>
          {ultimo ? <EstadoDespliegue estado={ultimo.estado} /> : null}
        </div>
        <p className="flex flex-wrap items-center gap-4 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Globe className="size-3.5" aria-hidden />
            <span className="text-foreground">{url.replace(/^https?:\/\//, "")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <GitBranch className="size-3.5" aria-hidden />
            {proyecto.rama}
          </span>
          <span className="flex items-center gap-1.5">
            <Box className="size-3.5" aria-hidden />
            Dockerfile
          </span>
          {ultimo ? <RielEtapas etapas={etapasDelRiel(ultimo)} saludable={enLinea} /> : null}
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-2">
        {enLinea ? (
          <Button asChild variant="outline" size="sm">
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink />
              Visitar
            </a>
          </Button>
        ) : null}
        {enResumen ? <AccionesDelResumen proyectoId={proyecto.id} /> : null}
        <BotonDesplegar proyectoId={proyecto.id} bloqueado={bloqueada} />
        <MasAcciones proyectoId={proyecto.id} />
      </div>
    </div>
  );
}

/** «Reiniciar» y «Detener» de 13 con el estado que publica su sondeo; al accionar, 13 sigue sondeando. */
function AccionesDelResumen({ proyectoId }: { proyectoId: string }) {
  const estado = useEstadoActivo();
  if (estado === null) return null;
  return (
    <AccionesContenedor
      proyectoId={proyectoId}
      estado={estado}
      alAccionar={() => window.dispatchEvent(new Event(EVENTO_ACCION_CONTENEDOR))}
    />
  );
}

const ICONO_OPCION = { "Cambiar rama": <GitBranch aria-hidden />, "Eliminar proyecto": <Trash2 aria-hidden /> };

function MasAcciones({ proyectoId }: { proyectoId: string }) {
  const opciones = opcionesMasAcciones(proyectoId).map((opcion) => ({ ...opcion, icono: ICONO_OPCION[opcion.etiqueta] }));
  return (
    <Menu
      disparador={
        <Button type="button" variant="outline" size="icon-sm" aria-label="Más acciones">
          <Ellipsis />
        </Button>
      }
      opciones={opciones}
      separadorAntesDe={[opciones.length - 1]}
    />
  );
}