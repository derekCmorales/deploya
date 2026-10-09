"use client";

import { ExternalLink, FolderGit2, Globe } from "lucide-react";
import type { ReactNode } from "react";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { RielEtapas } from "@/components/deploya/riel-etapas";
import { VariablesProyectoComponent } from "@/components/deploya/variables-proyecto";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDespliegue } from "@/hooks/use-despliegue";
import { DOMINIO_APPS, ESQUEMA_APPS } from "@/lib/api";
import {
  duracionEtapa,
  etapasDelRiel,
  recursosPlan,
  repositorioCorto,
  shaCorto,
  urlProyecto,
  type PlanProyectos,
  type ProyectoEnLista,
} from "@/lib/proyectos";

import { EliminarProyecto } from "./eliminar-proyecto";

/** Panel derecho de la pantalla 10: el proyecto seleccionado y su último despliegue. */
export function DetalleProyecto({
  proyecto,
  plan,
  onEliminado,
}: {
  proyecto: ProyectoEnLista & { variables?: any[] };
  plan: PlanProyectos;
  onEliminado: () => void;
}) {
  const ultimo = proyecto.ultimoDespliegue;
  const { datos: vista } = useDespliegue(ultimo?.id ?? null);
  const despliegue = vista ?? ultimo;
  const url = vista?.url ?? urlProyecto(proyecto.subdominio, DOMINIO_APPS, ESQUEMA_APPS);
  const enLinea = despliegue?.estado === "saludable";

  const guardarVariables = async (nuevasVariables: any[]) => {
    try {
      const res = await fetch(`/api/proyectos/${proyecto.id}/variables`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: nuevasVariables }),
      });
      if (!res.ok) throw new Error("Error al guardar variables");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-w-0 flex-col overflow-auto">
      <div className="flex flex-col gap-4 border-b border-border px-7 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">Seleccionado</p>
            <div className="flex items-center gap-3">
              <h2 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">{proyecto.nombre}</h2>
              {despliegue ? <EstadoDespliegue estado={despliegue.estado} /> : null}
            </div>
          </div>
          {enLinea ? (
            <Button asChild variant="outline" size="sm">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink />
                Visitar
              </a>
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Globe className="size-3.5" aria-hidden />
            <span className={enLinea ? "text-foreground" : undefined}>{url.replace(/^https?:\/\//, "")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <FolderGit2 className="size-3.5" aria-hidden />
            {repositorioCorto(proyecto.urlRepositorio)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-border px-7 py-6">
        {despliegue ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Despliegue #{despliegue.numero}</span>
              {vista?.commit ? (
                <span className="font-mono text-xs text-muted-foreground">
                  {shaCorto(vista.commit.sha)} · {vista.commit.mensaje}
                </span>
              ) : null}
            </div>
            <RielEtapas
              size="lg"
              etapas={etapasDelRiel(despliegue)}
              detalle={despliegue.etapas.map((e) => ({ duracion: duracionEtapa(e.duracionMs) }))}
              saludable={enLinea}
            />
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
      </div>

      <dl className="grid grid-cols-1 border-b border-border sm:grid-cols-3">
        <Dato titulo="Versión activa" valor={enLinea && despliegue ? `#${despliegue.numero}${vista?.commit ? ` · ${shaCorto(vista.commit.sha)}` : ""}` : "—"}>
          {enLinea ? <EstadoDespliegue estado="saludable" /> : <span className="text-xs text-muted-foreground">Sin versión activa todavía</span>}
        </Dato>
        <Dato titulo="Recursos" valor={recursosPlan(plan)}>
          <span className="text-xs text-muted-foreground">Plan {plan.nombre}</span>
        </Dato>
        <Dato titulo="Origen" valor={`Dockerfile · puerto ${proyecto.puertoInterno}`}>
          <span className="text-xs text-muted-foreground">Subdominio automático con HTTPS</span>
        </Dato>
      </dl>

      {/* Sección de Variables de Entorno del Proyecto (M3-03) */}
      <div className="border-b border-border px-7 py-6">
        <VariablesProyectoComponent
          variablesIniciales={proyecto.variables ?? []}
          onGuardar={guardarVariables}
        />
      </div>

      <EliminarProyecto proyecto={proyecto} onEliminado={onEliminado} />
    </div>
  );
}

function Dato({ titulo, valor, children }: { titulo: string; valor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5 border-border px-7 py-[18px] sm:border-l sm:first:border-l-0">
      <dt className="text-xs text-muted-foreground">{titulo}</dt>
      <dd className="font-mono text-sm">{valor}</dd>
      <dd>{children}</dd>
    </div>
  );
}