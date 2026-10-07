"use client";

import { ArrowDown, ArrowRight, ArrowUp, CalendarClock, LoaderCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDescenso } from "@/hooks/use-suscripcion";
import type { PlanCatalogo } from "@/lib/planes";
import { opcionesCambio, rutaContratar, type MiSuscripcion, type OpcionCambio, type TipoCambio } from "@/lib/suscripcion";

const ETIQUETAS: Record<TipoCambio, { texto: string; Icono: LucideIcon }> = {
  ascenso: { texto: "Ascenso", Icono: ArrowUp },
  descenso: { texto: "Descenso", Icono: ArrowDown },
  contratacion: { texto: "Contratar", Icono: ArrowRight },
};

/** «Cambiar plan» de 08: ascenso y contratación van a pagar (07); descenso se programa aquí y aplica al vencer. */
export function PanelCambiarPlan({
  suscripcion,
  catalogo,
  alCambiar,
}: {
  suscripcion: MiSuscripcion;
  catalogo: PlanCatalogo[] | null;
  alCambiar: () => void;
}) {
  const descenso = useDescenso(alCambiar);
  const opciones = catalogo ? opcionesCambio(catalogo, suscripcion) : null;
  const primerPago = opciones?.find((o) => o.tipo !== "descenso")?.plan.codigo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-1 text-base">Cambiar plan</CardTitle>
        <span className="text-[13px] text-muted-foreground">El nuevo plan empieza hoy</span>
      </CardHeader>
      {descenso.error ? (
        <Banner variant="bad" title="No pudimos programar el cambio." className="mx-4 mb-3">
          {descenso.error.message}
        </Banner>
      ) : null}
      {opciones ? (
        <ul>
          {opciones.map((opcion) => (
            <li key={opcion.plan.codigo} className="flex items-center gap-3 border-t border-border px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{opcion.plan.nombre}</span>
                  <span className="font-mono text-[13px] text-muted-foreground">{opcion.precio}</span>
                  <EtiquetaCambio opcion={opcion} />
                </div>
                <p className="text-[13px] text-muted-foreground">{opcion.texto}</p>
              </div>
              <AccionCambio
                opcion={opcion}
                principal={opcion.plan.codigo === primerPago}
                enCurso={descenso.enCurso === opcion.plan.codigo}
                programar={descenso.programar}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
    </Card>
  );
}

function EtiquetaCambio({ opcion }: { opcion: OpcionCambio }) {
  if (opcion.programado) {
    return (
      <Badge variant="signal">
        <CalendarClock aria-hidden />
        Programado
      </Badge>
    );
  }
  const { texto, Icono } = ETIQUETAS[opcion.tipo];
  return (
    <Badge>
      <Icono aria-hidden />
      {texto}
    </Badge>
  );
}

function AccionCambio({
  opcion,
  principal,
  enCurso,
  programar,
}: {
  opcion: OpcionCambio;
  principal: boolean;
  enCurso: boolean;
  programar: (plan: string) => Promise<void>;
}) {
  const texto = `Cambiar a ${opcion.plan.nombre}`;
  if (opcion.tipo !== "descenso") {
    return (
      <Button asChild size="sm" variant={principal ? "default" : "outline"}>
        <Link href={rutaContratar(opcion.plan.codigo)}>{texto}</Link>
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" disabled={opcion.programado || enCurso} onClick={() => void programar(opcion.plan.codigo)}>
      {enCurso ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
      {texto}
    </Button>
  );
}
