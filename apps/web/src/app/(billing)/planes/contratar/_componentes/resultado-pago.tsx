import { BadgeCheck, Check, CircleX, LoaderCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EstadoSuscripcion } from "@/components/deploya/estado-suscripcion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Sunken } from "@/components/ui/card";
import type { FaseContratacion } from "@/hooks/use-suscripcion";
import { RUTA_SUSCRIPCION, rangoVigencia } from "@/lib/suscripcion";
import { cn } from "@/lib/utils";

const RUTA_PROYECTOS = "/projects";

type FaseResultado = Extract<FaseContratacion, { fase: "procesando" | "resultado" }>;

/** 07b: procesando (pasos), aprobado (Activa y comprobante) o rechazado (motivo, sin cambios). */
export function ResultadoPago({
  estado,
  plan,
  alCambiarTarjeta,
  alReintentar,
}: {
  estado: FaseResultado;
  plan: string;
  alCambiarTarjeta: () => void;
  alReintentar: () => void;
}) {
  if (estado.fase === "procesando") return <Procesando ultimos4={estado.ultimos4} />;
  const { resultado } = estado;
  if (resultado.resultado === "aprobado") {
    const { suscripcion, pago } = resultado;
    return (
      <Marco
        etiqueta={<Badge variant="ok"><BadgeCheck aria-hidden />Aprobado</Badge>}
        titulo="Pago aprobado"
        texto={`Tu plan ${plan} ya está activo. Las nuevas cuotas se aplicaron de inmediato.`}
        acciones={
          <>
            <Button asChild variant="outline">
              <Link href={RUTA_SUSCRIPCION}>Ver mi suscripción</Link>
            </Button>
            <Button asChild>
              <Link href={RUTA_PROYECTOS}>Ir a proyectos</Link>
            </Button>
          </>
        }
      >
        <Fila etiqueta="Suscripción">
          <EstadoSuscripcion estado={suscripcion.estado} />
        </Fila>
        {suscripcion.vence ? <Fila etiqueta="Vigencia">{rangoVigencia(suscripcion.inicio, suscripcion.vence)}</Fila> : null}
        <Fila etiqueta="Comprobante">{pago.numeroComprobante}</Fila>
      </Marco>
    );
  }
  return (
    <Marco
      etiqueta={<Badge variant="bad"><CircleX aria-hidden />Rechazado</Badge>}
      titulo="Pago rechazado"
      texto="No se aplicó ningún cambio a tu plan."
      acciones={
        <>
          <Button variant="outline" onClick={alCambiarTarjeta}>
            Cambiar tarjeta
          </Button>
          <Button onClick={alReintentar}>Intentar de nuevo</Button>
        </>
      }
    >
      <Fila etiqueta="Motivo">{resultado.motivo}</Fila>
      <p className="font-mono text-xs text-muted-foreground">
        {resultado.codigo} · •••• {resultado.pago.tarjetaUltimos4}
      </p>
    </Marco>
  );
}

const PASOS_PROCESO: { texto: string; icono: LucideIcon; estado: "hecho" | "en-curso" | "pendiente" }[] = [
  { texto: "Orden creada", icono: Check, estado: "hecho" },
  { texto: "Autorizando con la pasarela", icono: LoaderCircle, estado: "en-curso" },
  { texto: "Aplicando cuota del plan", icono: Check, estado: "pendiente" },
];

function Procesando({ ultimos4 }: { ultimos4: string }) {
  return (
    <Marco
      etiqueta={<Badge variant="signal"><LoaderCircle aria-hidden className="animate-spin" />Procesando</Badge>}
      titulo="Confirmando el pago"
      texto={
        <>
          La pasarela simulada está procesando la tarjeta <span className="font-mono">•••• {ultimos4}</span>. No cierres esta ventana.
        </>
      }
      acciones={
        <Button disabled>
          <LoaderCircle className="animate-spin" aria-hidden />
          Procesando…
        </Button>
      }
    >
      <ol className="flex flex-col gap-2" aria-live="polite">
        {PASOS_PROCESO.map(({ texto, icono: Icono, estado }) => (
          <li key={texto} className={cn("flex items-center gap-2 text-sm", estado === "pendiente" && "text-muted-foreground")}>
            <Icono
              aria-hidden
              className={cn("size-4", estado === "hecho" && "text-ok", estado === "en-curso" && "animate-spin text-signal", estado === "pendiente" && "text-faint")}
            />
            {texto}
          </li>
        ))}
      </ol>
    </Marco>
  );
}

function Marco({
  etiqueta,
  titulo,
  texto,
  acciones,
  children,
}: {
  etiqueta: ReactNode;
  titulo: string;
  texto: ReactNode;
  acciones: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4 p-6" role="status">
      {etiqueta}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">{titulo}</h2>
        <p className="text-muted-foreground">{texto}</p>
      </div>
      <Sunken className="flex flex-col gap-3 px-4 py-3">{children}</Sunken>
      <div className="flex flex-wrap justify-end gap-2">{acciones}</div>
    </Card>
  );
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="font-mono text-[13px]">{children}</span>
    </div>
  );
}
