import { Check, Cpu, FolderGit2, Hammer, Info, MemoryStick, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  esGratuito,
  RECURSOS,
  textoPeriodo,
  textoPrecio,
  type ClaveRecurso,
  type PlanCatalogo,
  type Vigencia,
} from "@/lib/planes";
import { cn } from "@/lib/utils";

const ICONOS: Record<ClaveRecurso, LucideIcon> = {
  maxProyectos: FolderGit2,
  cpus: Cpu,
  memoriaMb: MemoryStick,
  construccionesMes: Hammer,
};

const CONTRATACION_PENDIENTE = "La contratación llega en la próxima entrega";

interface TablaPlanesProps {
  planes: PlanCatalogo[];
  vigencia: Vigencia;
  /** Código del plan de la sesión; `null` sin sesión (visitante). */
  codigoActual: string | null;
}

export function TablaPlanes({ planes, vigencia, codigoActual }: TablaPlanesProps) {
  const esActual = (plan: PlanCatalogo) => plan.codigo === codigoActual;
  const columna = (plan: PlanCatalogo, ultima = false) =>
    cn(esActual(plan) && "border-x border-border-strong bg-card", esActual(plan) && ultima && "rounded-b-[14px] border-b");

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <div
          role="table"
          aria-label="Planes y recursos por proyecto"
          className="grid min-w-[960px]"
          style={{ gridTemplateColumns: `260px repeat(${planes.length}, minmax(0, 1fr))` }}
        >
          <div role="row" className="contents">
            <div role="columnheader" className="flex flex-col justify-end gap-2 py-5 pr-5">
              <p className="text-[13px] font-medium text-muted-foreground">§4.2 · Recursos</p>
              <p className="text-[13px] text-muted-foreground">
                Lo que el contenedor de cada proyecto recibe. Se aplica con los límites de Docker.
              </p>
            </div>
            {planes.map((plan) => (
              <div
                key={plan.codigo}
                role="columnheader"
                className={cn(
                  "flex flex-col gap-3 border border-transparent p-5",
                  esActual(plan) && "rounded-t-[14px] border-border-strong border-b-0 bg-card",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold tracking-[-0.02em]">{plan.nombre}</h2>
                  {esActual(plan) ? (
                    <Badge variant="outline">
                      <Check aria-hidden />
                      Plan actual
                    </Badge>
                  ) : null}
                </div>
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-2xl font-semibold tracking-[-0.03em] whitespace-nowrap">{textoPrecio(plan, vigencia)}</span>
                  {textoPeriodo(plan, vigencia) ? (
                    <span className="text-[13px] whitespace-nowrap text-muted-foreground">{textoPeriodo(plan, vigencia)}</span>
                  ) : null}
                </p>
                <p className="min-h-8 text-[13px] text-muted-foreground">{plan.descripcion}</p>
                <AccionPlan plan={plan} actual={esActual(plan)} />
              </div>
            ))}
          </div>
          {RECURSOS.map((recurso, i) => {
            const Icono = ICONOS[recurso.clave];
            const ultima = i === RECURSOS.length - 1;
            return (
              <div role="row" key={recurso.clave} className="contents">
                <div role="rowheader" className="flex items-center gap-2 border-t border-border py-3 text-sm">
                  <Icono aria-hidden className="size-4 text-muted-foreground" />
                  <span>{recurso.etiqueta}</span>
                </div>
                {planes.map((plan) => (
                  <div
                    role="cell"
                    key={plan.codigo}
                    className={cn("border-t border-border px-5 py-3 font-mono text-[13px]", columna(plan, ultima))}
                  >
                    {recurso.formato(plan[recurso.clave])}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <Info aria-hidden className="size-4" />
        Todos los proyectos corren en un único servidor (VPS) y se publican en un subdominio
        <code className="font-mono text-foreground">*.deploya.app</code>
        con HTTPS.
      </p>
    </div>
  );
}

function AccionPlan({ plan, actual }: { plan: PlanCatalogo; actual: boolean }) {
  if (actual) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Plan actual
      </Button>
    );
  }
  if (esGratuito(plan)) return <span aria-hidden className="h-9" />;
  return (
    <Button className="w-full" disabled title={CONTRATACION_PENDIENTE}>
      Contratar
    </Button>
  );
}

export function TablaPlanesCargando() {
  return (
    <div aria-busy="true" aria-label="Cargando planes" className="grid grid-cols-[260px_repeat(4,minmax(0,1fr))] gap-5">
      <span />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-3 p-5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
