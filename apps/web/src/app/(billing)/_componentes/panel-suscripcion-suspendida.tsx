import { CircleCheck, CirclePause, RefreshCw } from "lucide-react";
import Link from "next/link";

import { EstadoSuscripcion } from "@/components/deploya/estado-suscripcion";
import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CONSERVADO_SUSPENDIDA,
  fechaLarga,
  NOTA_RENOVAR_SUSPENDIDA,
  rutaRenovar,
  textoQuePasoSuspendida,
  type MiSuscripcion,
} from "@/lib/suscripcion";

/**
 * Pantalla 28 · «Suscripción suspendida · panel bloqueado» (M2-05): se muestra cuando
 * `/suscripciones/mia` dice `suspendida`. `detenidos` sale de la lista de proyectos; `null`
 * mientras carga. Reutilizable fuera de 08 (la lista de proyectos puede montarlo).
 */
export function PanelSuscripcionSuspendida({ suscripcion, detenidos }: { suscripcion: MiSuscripcion; detenidos: number | null }) {
  return (
    <Card className="mx-auto flex w-full max-w-[560px] flex-col gap-6 p-7" role="alert">
      <div className="flex items-center gap-2.5">
        <EstadoSuscripcion estado="suspendida" />
        <span className="text-[13px] text-muted-foreground">desde {fechaLarga(suscripcion.estadoDesde)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg border border-border-strong bg-sunken text-bad">
          <CirclePause className="size-5" aria-hidden />
        </span>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Tu panel está en pausa</h2>
      </div>
      <section className="flex flex-col gap-1.5">
        <h3 className="text-[13px] font-medium text-muted-foreground">Qué pasó</h3>
        <p>{textoQuePasoSuspendida(suscripcion, detenidos)}</p>
      </section>
      <section className="flex flex-col gap-2.5 rounded-lg border border-border bg-sunken p-4">
        <h3 className="text-[13px] font-medium text-muted-foreground">Qué se conserva · 30 días</h3>
        <ul className="flex flex-col gap-2">
          {CONSERVADO_SUSPENDIDA.map((texto) => (
            <li key={texto} className="flex items-center gap-2 text-sm">
              <CircleCheck className="size-4 text-ok" aria-hidden />
              {texto}
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={rutaRenovar(suscripcion)}>
              <RefreshCw />
              Renovar
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={RUTA_PLANES}>Ver planes</Link>
          </Button>
        </div>
        <p className="text-[13px] text-muted-foreground">{NOTA_RENOVAR_SUSPENDIDA}</p>
      </div>
    </Card>
  );
}
