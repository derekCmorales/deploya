"use client";

import { CircleCheck, CircleX, Clock, CreditCard, FlaskConical } from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";

import { RUTA_PLANES } from "@/components/shell/nav-panel";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, Sunken } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  formatearNumeroTarjeta,
  formatearVencimiento,
  TARJETAS_PRUEBA,
  textoMonto,
  type ErroresTarjeta,
  type FormularioTarjeta,
  type TarjetaPrueba,
} from "@/lib/suscripcion";

const ICONO_EFECTO = { aprueba: CircleCheck, rechaza: CircleX, "tarda 5 s": Clock } as const;
/** Datos de relleno de las tarjetas de prueba (cualquier fecha futura y CVC sirven). */
const VENCIMIENTO_PRUEBA = "12 / 28";
const CVC_PRUEBA = "123";

/** Tarjeta de 07 con el aviso de pasarela simulada y los atajos a las tarjetas de prueba. */
export function FormularioPago({
  tarjeta,
  errores,
  monto,
  alCambiar,
  alEnviar,
}: {
  tarjeta: FormularioTarjeta;
  errores: ErroresTarjeta;
  monto: number;
  alCambiar: (tarjeta: FormularioTarjeta) => void;
  alEnviar: (e: FormEvent) => void;
}) {
  const campo = (clave: keyof FormularioTarjeta, valor: string) => alCambiar({ ...tarjeta, [clave]: valor });
  const usarPrueba = (prueba: TarjetaPrueba) =>
    alCambiar({
      ...tarjeta,
      numero: prueba.numero,
      vencimiento: tarjeta.vencimiento || VENCIMIENTO_PRUEBA,
      cvc: tarjeta.cvc || CVC_PRUEBA,
    });
  const invalido = (clave: keyof FormularioTarjeta) => ({
    "aria-invalid": errores[clave] ? true : undefined,
    "aria-describedby": errores[clave] ? `${clave}-msg` : undefined,
  });

  return (
    <Card className="overflow-hidden">
      <form onSubmit={alEnviar} noValidate>
        <div className="flex items-center gap-3 border-b border-signal-line bg-signal-soft px-4 py-3">
          <FlaskConical aria-hidden className="size-[18px] text-signal" />
          <div className="flex-1">
            <p className="font-medium">Pasarela simulada</p>
            <p className="text-[13px] text-muted-foreground">No se realiza ningún cobro real. Solo acepta tarjetas de prueba.</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Datos de la tarjeta</h2>
          <Field id="titular" label="Titular" error={errores.titular}>
            <Input
              id="titular"
              autoComplete="cc-name"
              value={tarjeta.titular}
              onChange={(e) => campo("titular", e.target.value)}
              {...invalido("titular")}
            />
          </Field>
          <Field id="numero" label="Número de tarjeta" error={errores.numero}>
            <div className="relative">
              <CreditCard aria-hidden className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                id="numero"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                className="pl-8 font-mono"
                value={tarjeta.numero}
                onChange={(e) => campo("numero", formatearNumeroTarjeta(e.target.value))}
                {...invalido("numero")}
              />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="vencimiento" label="Vencimiento" error={errores.vencimiento}>
              <Input
                id="vencimiento"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM / AA"
                className="font-mono"
                value={tarjeta.vencimiento}
                onChange={(e) => campo("vencimiento", formatearVencimiento(e.target.value))}
                {...invalido("vencimiento")}
              />
            </Field>
            <Field id="cvc" label="CVC" error={errores.cvc}>
              <Input
                id="cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                className="font-mono"
                value={tarjeta.cvc}
                onChange={(e) => campo("cvc", e.target.value.replace(/\D/g, ""))}
                {...invalido("cvc")}
              />
            </Field>
          </div>
          <Sunken className="flex flex-col gap-2 px-3.5 py-3">
            <p className="text-xs font-medium text-muted-foreground">Tarjetas de prueba</p>
            <div className="flex flex-wrap gap-2">
              {TARJETAS_PRUEBA.map((prueba) => {
                const Icono = ICONO_EFECTO[prueba.efecto];
                return (
                  <Button key={prueba.numero} type="button" variant="outline" size="xs" onClick={() => usarPrueba(prueba)}>
                    <Icono aria-hidden />
                    <span className="font-mono">{prueba.numero}</span> · {prueba.efecto}
                  </Button>
                );
              })}
            </div>
          </Sunken>
        </div>
        <CardFooter>
          <span className="flex-1 text-[13px] text-muted-foreground">Al confirmar aceptas los términos del plan.</span>
          <Button asChild variant="ghost">
            <Link href={RUTA_PLANES}>Cancelar</Link>
          </Button>
          <Button type="submit">Confirmar pago · {textoMonto(monto)}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
