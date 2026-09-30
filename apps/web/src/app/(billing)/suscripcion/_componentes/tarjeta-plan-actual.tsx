import { RefreshCw } from "lucide-react";
import Link from "next/link";

import { EstadoSuscripcion } from "@/components/deploya/estado-suscripcion";
import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  fechaCorta,
  fechaLarga,
  progresoVigencia,
  rutaContratar,
  textoCuotaActual,
  textoDias,
  vigenciaDeParametro,
  type MiSuscripcion,
} from "@/lib/suscripcion";

const ESTADOS_SIN_SERVICIO = ["vencida", "suspendida", "cancelada"];

/** Primera card de 08: plan actual, estado, vigencia con barra y acciones. */
export function TarjetaPlanActual({ suscripcion, ahora }: { suscripcion: MiSuscripcion; ahora: Date }) {
  const { plan, vence, vigenciaDias, planSiguiente } = suscripcion;
  const renovable = vence !== null && vigenciaDias !== null;

  return (
    <div className="flex flex-col gap-3">
      <Card className="grid grid-cols-1 items-center gap-10 p-6 lg:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-muted-foreground">Plan actual</p>
          <div className="flex items-center gap-3">
            <h2 className="text-4xl font-semibold tracking-[-0.035em]">{plan.nombre}</h2>
            <EstadoSuscripcion estado={suscripcion.estado} size="lg" />
          </div>
          <p className="text-muted-foreground">{textoCuotaActual(suscripcion)}</p>
        </div>
        {renovable ? <BarraVigencia suscripcion={suscripcion} vence={vence} ahora={ahora} /> : <SinVencimiento />}
        <div className="flex items-center gap-2">
          {renovable ? (
            <Button asChild variant="outline">
              <Link href={rutaContratar(plan.codigo, vigenciaDeParametro(String(vigenciaDias)))}>
                <RefreshCw />
                Renovar ahora
              </Link>
            </Button>
          ) : null}
          <Button asChild>
            <Link href={RUTA_PLANES}>Cambiar plan</Link>
          </Button>
        </div>
      </Card>
      {planSiguiente && vence ? (
        <Banner variant="muted" title="Descenso programado">
          El {fechaLarga(vence)} pasas a {planSiguiente.nombre}. Hasta entonces sigues en {plan.nombre}; si renuevas, se cancela.
        </Banner>
      ) : null}
      {ESTADOS_SIN_SERVICIO.includes(suscripcion.estado) ? (
        <Banner variant="warn" title="Tu vigencia terminó">
          Tus entornos siguen en línea durante la gracia, pero no puedes crear proyectos ni desplegar. Renueva para seguir.
        </Banner>
      ) : null}
    </div>
  );
}

function BarraVigencia({ suscripcion, vence, ahora }: { suscripcion: MiSuscripcion; vence: string; ahora: Date }) {
  const progreso = progresoVigencia(suscripcion.inicio, vence, ahora);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-muted-foreground">Vigencia</span>
        <span>
          <span className="font-medium">{textoDias(suscripcion.diasRestantes ?? 0)}</span>{" "}
          <span className="text-muted-foreground">restantes</span>
        </span>
      </div>
      <div
        className="relative h-[18px]"
        role="meter"
        aria-label="Vigencia transcurrida"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progreso}
      >
        <span className="absolute inset-x-0 top-2 h-0.5 rounded-full bg-border-strong" />
        <span className="absolute top-2 left-0 h-0.5 rounded-full bg-foreground" style={{ width: `${progreso}%` }} />
        <span className="absolute top-[3px] left-0 h-3 w-px bg-border-stronger" />
        <span className="absolute top-[3px] right-0 h-3 w-px bg-border-stronger" />
        <span
          className="absolute top-1 size-2.5 rounded-full border-2 border-foreground bg-background"
          style={{ left: `calc(${progreso}% - 5px)` }}
        />
      </div>
      <div className="flex justify-between font-mono text-xs text-muted-foreground">
        <span>{fechaCorta(suscripcion.inicio)}</span>
        <span className="text-foreground">hoy · {fechaCorta(ahora.toISOString())}</span>
        <span>{fechaLarga(vence)}</span>
      </div>
    </div>
  );
}

function SinVencimiento() {
  return (
    <div className="flex flex-col gap-1 text-[13px]">
      <span className="text-muted-foreground">Vigencia</span>
      <span className="font-medium">Sin vencimiento</span>
      <span className="text-muted-foreground">Sandbox no se paga ni se renueva.</span>
    </div>
  );
}
