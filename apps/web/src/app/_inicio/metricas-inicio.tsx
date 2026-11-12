import { CreditCard, FolderGit2, Hammer, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EstadoSuscripcion } from "@/components/deploya/estado-suscripcion";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";
import { textoReinicio } from "@/lib/actividad";
import { recursosPlan, type ListaProyectos } from "@/lib/proyectos";
import { RUTA_SUSCRIPCION, textoChipPlan, textoCuotaActual, type ConsumoPeriodo, type MiSuscripcion } from "@/lib/suscripcion";

/** Tres números del panel: proyectos del plan, construcciones del mes y el plan (solo en la nube). */
export function MetricasInicio({
  lista,
  consumo,
  suscripcion,
  cobro,
}: {
  lista: ListaProyectos | null;
  consumo: ConsumoPeriodo | null;
  suscripcion: MiSuscripcion | null;
  cobro: boolean;
}) {
  return (
    <section aria-label="Resumen de tu cuenta" className={cobro ? "grid grid-cols-1 gap-4 md:grid-cols-3" : "grid grid-cols-1 gap-4 md:grid-cols-2"}>
      <Metrica icono={FolderGit2} titulo="Proyectos" pie={lista ? `${recursosPlan(lista.plan)} por proyecto` : null}>
        {lista ? (
          <Meter label="Del plan" value={lista.usados} max={lista.maximo} tonoAlLimite="warn" />
        ) : (
          <Skeleton className="h-9 w-full" />
        )}
      </Metrica>
      <Metrica icono={Hammer} titulo="Construcciones del mes" pie={consumo ? textoReinicio(consumo.periodo.reinicia) : null}>
        {consumo ? (
          <Meter label="Usadas" value={consumo.construcciones.usadas} max={consumo.construcciones.limite} />
        ) : (
          <Skeleton className="h-9 w-full" />
        )}
      </Metrica>
      {cobro ? (
        <Metrica
          icono={CreditCard}
          titulo="Plan"
          accion={
            <Link href={RUTA_SUSCRIPCION} className="text-xs font-medium text-muted-foreground underline-offset-[3px] hover:text-foreground hover:underline">
              Ver suscripción
            </Link>
          }
          pie={suscripcion ? textoCuotaActual(suscripcion) : null}
        >
          {suscripcion ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-semibold tracking-[-0.02em]">{textoChipPlan(suscripcion)}</span>
              <EstadoSuscripcion estado={suscripcion.estado} />
            </div>
          ) : (
            <Skeleton className="h-9 w-full" />
          )}
        </Metrica>
      ) : null}
    </section>
  );
}

function Metrica({
  icono: Icono,
  titulo,
  accion,
  pie,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  accion?: ReactNode;
  pie: string | null;
  children: ReactNode;
}) {
  return (
    <Card className="dy-entrada flex flex-col gap-4 p-[18px]">
      <div className="flex items-center gap-2">
        <Icono className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="flex-1 text-sm font-semibold">{titulo}</h2>
        {accion}
      </div>
      {children}
      <p className="text-xs text-muted-foreground">{pie ?? " "}</p>
    </Card>
  );
}
