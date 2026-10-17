import { Check, RefreshCw } from "lucide-react";
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
    <section className="flex flex-col gap-4" role="alert">
      <div className="flex items-center gap-3">
        <EstadoSuscripcion estado="suspendida" size="lg" />
        <span className="text-[13px] text-muted-foreground">desde {fechaLarga(suscripcion.estadoDesde)}</span>
      </div>
      <h2 className="text-2xl font-semibold tracking-[-0.025em]">Tu panel está en pausa</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-2 p-4">
          <h3 className="text-[13px] text-muted-foreground">Qué pasó</h3>
          <p className="text-sm">{textoQuePasoSuspendida(suscripcion, detenidos)}</p>
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <h3 className="text-[13px] text-muted-foreground">Qué se conserva · 30 días</h3>
          <ul className="flex flex-col gap-1.5">
            {CONSERVADO_SUSPENDIDA.map((texto) => (
              <li key={texto} className="flex items-center gap-2 text-sm">
                <Check className="size-3.5 text-muted-foreground" aria-hidden />
                {texto}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href={rutaRenovar(suscripcion)}>
            <RefreshCw />
            Renovar
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={RUTA_PLANES}>Ver planes</Link>
        </Button>
      </div>
      <p className="text-[13px] text-muted-foreground">{NOTA_RENOVAR_SUSPENDIDA}</p>
    </section>
  );
}
