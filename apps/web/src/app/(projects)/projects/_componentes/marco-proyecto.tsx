"use client";

import { ExternalLink, GitBranch } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { TabsNav } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProyectos } from "@/hooks/use-proyectos";
import { DOMINIO_APPS, ESQUEMA_APPS } from "@/lib/api";
import { urlProyecto, type ProyectoEnLista } from "@/lib/proyectos";

import { BotonDesplegar } from "./boton-desplegar";

/** Cabecera y pestañas de 13–19: Resumen, Despliegues, Variables y Configuración. */
export function MarcoProyecto({ proyectoId }: { proyectoId: string }) {
  const ruta = usePathname();
  const { datos } = useProyectos({ sondear: false });
  const proyecto = datos?.proyectos.find((p) => p.id === proyectoId) ?? null;
  const resumen = `/projects/${proyectoId}`;
  const despliegues = `/projects/${proyectoId}/despliegues`;
  const variables = `/projects/${proyectoId}/variables`;
  const configuracion = `/projects/${proyectoId}/configuracion`;

  return (
    <header className="flex flex-col gap-4 border-b border-border px-8 pt-6">
      <Link href="/projects" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
        proyectos
      </Link>
      {proyecto ? <Identidad proyecto={proyecto} /> : <Skeleton className="h-8 w-64" />}
      <TabsNav aria-label="Secciones del proyecto">
        <Link href={resumen} aria-current={ruta === resumen ? "page" : undefined}>
          Resumen
        </Link>
        <Link href={despliegues} aria-current={ruta === despliegues || ruta?.startsWith(`${despliegues}/`) ? "page" : undefined}>
          Despliegues
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

function Identidad({ proyecto }: { proyecto: ProyectoEnLista }) {
  const ultimo = proyecto.ultimoDespliegue;
  const url = urlProyecto(proyecto.subdominio, DOMINIO_APPS, ESQUEMA_APPS);
  const enLinea = ultimo?.estado === "saludable";
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">{proyecto.nombre}</h1>
          {ultimo ? <EstadoDespliegue estado={ultimo.estado} /> : null}
        </div>
        <p className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
          <span>{url.replace(/^https?:\/\//, "")}</span>
          <span className="flex items-center gap-1">
            <GitBranch className="size-3.5" aria-hidden />
            {proyecto.rama}
          </span>
          <span>Dockerfile</span>
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
        <BotonDesplegar proyectoId={proyecto.id} />
      </div>
    </div>
  );
}
