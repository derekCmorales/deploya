"use client";

import Link from "next/link";

import { EstadoDespliegue } from "@/components/deploya/estado-despliegue";
import { PuntoVivo } from "@/components/deploya/punto-vivo";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { rutaDespliegue } from "@/lib/despliegues";
import { actividadReciente } from "@/lib/inicio";
import { despliegueEnCurso, haceCuanto, type ListaProyectos } from "@/lib/proyectos";

/** «Actividad reciente»: el último despliegue de cada proyecto, del más nuevo al más viejo. */
export function ActividadInicio({ lista }: { lista: ListaProyectos }) {
  const actividad = actividadReciente(lista);
  const ahora = new Date();
  return (
    <Card className="dy-entrada flex flex-col">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle>Actividad reciente</CardTitle>
      </CardHeader>
      {actividad.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Cuando despliegues, aquí verás cada versión.</p>
      ) : (
        <ol className="flex flex-col">
          {actividad.map(({ proyectoId, proyecto, despliegue }) => (
            <li key={despliegue.id} className="relative flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/50">
              <span className="grid size-4 place-items-center" aria-hidden>
                {despliegueEnCurso(despliegue.estado) ? <PuntoVivo /> : <span className="size-1.5 rounded-full bg-border-stronger" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                  href={rutaDespliegue(proyectoId, despliegue.numero)}
                  className="truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                  {proyecto}
                  <span className="ml-1.5 font-mono text-xs text-muted-foreground">#{despliegue.numero}</span>
                </Link>
                <span className="tnum text-xs text-muted-foreground">{haceCuanto(despliegue.creado, ahora)}</span>
              </div>
              <EstadoDespliegue estado={despliegue.estado} />
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
