import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Pasos } from "@/components/deploya/pasos";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sunken } from "@/components/ui/card";
import { contadorProyectos, recursosPlan, type ListaProyectos } from "@/lib/proyectos";

const PASOS = [
  { titulo: "Repositorio", detalle: "URL, rama y Dockerfile" },
  { titulo: "Variables", detalle: "Llega en la próxima entrega", deshabilitado: true },
  { titulo: "Revisar", detalle: "Confirmar y desplegar" },
] as const;

/** Columna izquierda del asistente (patrón E): pasos y recursos del plan. */
export function LateralAlta({ actual, lista }: { actual: number; lista: ListaProyectos | null }) {
  return (
    <aside className="flex flex-col gap-6 border-border bg-sunken px-8 py-7 lg:border-r">
      <Button asChild variant="ghost" size="sm" className="-ml-2.5 self-start">
        <Link href="/projects">
          <ArrowLeft />
          Proyectos
        </Link>
      </Button>
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Proyectos · Alta</p>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Nuevo proyecto</h1>
        {lista ? <p className="text-xs text-muted-foreground">{contadorProyectos(lista)}</p> : <Skeleton className="h-3 w-40" />}
      </div>
      <Pasos pasos={PASOS} actual={actual} />
      <Sunken className="mt-auto flex flex-col gap-2 bg-background p-3.5">
        <p className="text-xs font-medium text-muted-foreground">Recursos del plan</p>
        {lista ? (
          <>
            <p className="font-mono text-[13px]">{recursosPlan(lista.plan)}</p>
            <p className="text-xs text-muted-foreground">Límites de Docker para cada contenedor en {lista.plan.nombre}.</p>
          </>
        ) : (
          <Skeleton className="h-4 w-32" />
        )}
      </Sunken>
    </aside>
  );
}
