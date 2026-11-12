"use client";

import { ArrowRight, ExternalLink, GitBranch } from "lucide-react";
import Link from "next/link";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { RielEtapas } from "@/components/deploya/riel-etapas";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DOMINIO_APPS, ESQUEMA_APPS } from "@/lib/api";
import { grupoDeProyecto, proyectosParaInicio } from "@/lib/inicio";
import { etapasDelRiel, haceCuanto, urlProyecto, type ListaProyectos, type ProyectoEnLista } from "@/lib/proyectos";

/** «Tus proyectos»: lo que pide atención primero; cada fila abre el proyecto y su URL. */
export function ProyectosInicio({ lista }: { lista: ListaProyectos }) {
  const visibles = proyectosParaInicio(lista.proyectos);
  const ahora = new Date();
  return (
    <Card className="dy-entrada flex min-w-0 flex-col">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="flex-1">Tus proyectos</CardTitle>
        <Link href="/projects" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          Ver todos
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </CardHeader>
      <ul className="flex flex-col">
        {visibles.map((p) => (
          <FilaProyecto key={p.id} proyecto={p} ahora={ahora} />
        ))}
      </ul>
      {lista.proyectos.length > visibles.length ? (
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          y {lista.proyectos.length - visibles.length} más en{" "}
          <Link href="/projects" className="text-foreground underline-offset-[3px] hover:underline">
            Proyectos
          </Link>
        </p>
      ) : null}
    </Card>
  );
}

function FilaProyecto({ proyecto, ahora }: { proyecto: ProyectoEnLista; ahora: Date }) {
  const ultimo = proyecto.ultimoDespliegue;
  const enLinea = grupoDeProyecto(proyecto) === "en-linea";
  const url = urlProyecto(proyecto.subdominio, DOMINIO_APPS, ESQUEMA_APPS);
  return (
    <li className="group relative flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/projects/${proyecto.id}`}
          className="truncate text-sm font-semibold after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {proyecto.nombre}
        </Link>
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <span className="hidden items-center gap-1.5 sm:flex">
            <GitBranch className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{proyecto.rama}</span>
            <span aria-hidden>·</span>
          </span>
          <span className="truncate">
            {proyecto.subdominio}.{DOMINIO_APPS}
          </span>
        </span>
      </div>
      <RielEtapas etapas={etapasDelRiel(ultimo)} saludable={enLinea} className="hidden sm:flex" />
      <div className="flex w-[118px] flex-col items-end gap-1">
        {ultimo ? <EstadoDespliegue estado={ultimo.estado} /> : <span className="text-xs text-muted-foreground">Sin desplegar</span>}
        <span className="tnum text-xs text-muted-foreground">{ultimo ? haceCuanto(ultimo.creado, ahora) : "—"}</span>
      </div>
      {enLinea ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Visitar ${proyecto.nombre}`}
          className="relative z-10 grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="size-4" aria-hidden />
        </a>
      ) : (
        <span className="size-8" aria-hidden />
      )}
    </li>
  );
}
