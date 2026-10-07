"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Pasos } from "@/components/deploya/pasos";
import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSesion } from "@/hooks/use-sesion";
import { useContratacion, useCotizacion } from "@/hooks/use-suscripcion";
import {
  erroresTarjeta,
  RUTA_SUSCRIPCION,
  vigenciaDeParametro,
  type ErroresTarjeta,
  type FormularioTarjeta,
} from "@/lib/suscripcion";

import { FormularioPago } from "./formulario-pago";
import { ResultadoPago } from "./resultado-pago";
import { ResumenOrden } from "./resumen-orden";

const PASOS = [{ titulo: "Plan" }, { titulo: "Pago" }, { titulo: "Resultado" }] as const;
const PASO_PAGO = 1;
const PASO_RESULTADO = 2;
const CODIGOS_DE_SUSCRIPCION = ["es-descenso", "plan-sin-cobro"];

/** Container de 07 (resumen + tarjeta) y 07b (procesando, aprobado, rechazado). */
export function ContratarContenedor() {
  const parametros = useSearchParams();
  const plan = parametros.get("plan");
  const vigencia = vigenciaDeParametro(parametros.get("vigencia"));
  const { usuario } = useSesion();
  const cotizacion = useCotizacion(plan, vigencia);
  const { estado, contratar, volver } = useContratacion();
  const [tarjeta, setTarjeta] = useState<FormularioTarjeta>({ titular: usuario?.nombre ?? "", numero: "", vencimiento: "", cvc: "" });
  const [errores, setErrores] = useState<ErroresTarjeta>({});

  const pagar = () => {
    const encontrados = erroresTarjeta(tarjeta);
    setErrores(encontrados);
    if (plan && Object.keys(encontrados).length === 0) void contratar(plan, vigencia, tarjeta);
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    pagar();
  };

  const cambiarTarjeta = () => {
    setTarjeta((t) => ({ ...t, numero: "" }));
    volver();
  };

  const enFormulario = estado.fase === "formulario" || estado.fase === "error";

  return (
    <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-7 px-8 pt-7 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={RUTA_PLANES}>
            <ArrowLeft />
            Planes
          </Link>
        </Button>
        <Pasos pasos={PASOS} actual={enFormulario ? PASO_PAGO : PASO_RESULTADO} className="flex-row flex-wrap" />
      </div>
      <header className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Cobro · Contratar</p>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Confirma tu plan</h1>
        <p className="text-muted-foreground">Revisa el resumen y confirma el pago con la tarjeta de prueba.</p>
      </header>

      {!plan ? (
        <Banner variant="warn" title="Elige un plan para contratar." actions={<EnlaceBanner href={RUTA_PLANES} texto="Ver planes" />} />
      ) : null}
      {cotizacion.error ? (
        <Banner
          variant={CODIGOS_DE_SUSCRIPCION.includes(cotizacion.error.codigo) ? "warn" : "bad"}
          title="Este cambio no se paga aquí."
          actions={<EnlaceBanner href={RUTA_SUSCRIPCION} texto="Ir a Mi suscripción" />}
        >
          {cotizacion.error.message}
        </Banner>
      ) : null}
      {estado.fase === "error" ? (
        <Banner variant="bad" title="No pudimos procesar el pago.">
          {estado.error.message}
        </Banner>
      ) : null}

      {cotizacion.datos ? (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[400px_1fr]">
          <ResumenOrden cotizacion={cotizacion.datos} />
          {enFormulario ? (
            <FormularioPago
              tarjeta={tarjeta}
              errores={errores}
              monto={cotizacion.datos.monto}
              alCambiar={setTarjeta}
              alEnviar={enviar}
            />
          ) : (
            <ResultadoPago estado={estado} plan={cotizacion.datos.plan.nombre} alCambiarTarjeta={cambiarTarjeta} alReintentar={pagar} />
          )}
        </div>
      ) : plan && !cotizacion.error ? (
        <div aria-busy="true" aria-label="Preparando el resumen" className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : null}
    </main>
  );
}

function EnlaceBanner({ href, texto }: { href: string; texto: string }) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link href={href}>{texto}</Link>
    </Button>
  );
}
