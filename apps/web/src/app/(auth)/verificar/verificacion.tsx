"use client";

import { ArrowRight, CircleCheck, Link2Off, Mail, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { verificarCorreo } from "@/lib/api-identidad";
import { leerCorreoPendiente } from "@/lib/correo-pendiente";
import type { ResultadoVerificacion } from "@/lib/cuenta";

import { BotonReenviar } from "./boton-reenviar";

/** (a) sin token: revisa tu bandeja · (b) token válido · (c) token expirado o inválido. */
export function Verificacion() {
  const parametros = useSearchParams();
  const token = parametros.get("token");
  const correo = parametros.get("correo");
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  // El token es de un solo uso: Strict Mode monta el efecto dos veces en desarrollo y un
  // segundo POST daría 410. El ref sobrevive a ese remontaje y evita repetir el envío.
  const tokenEnviado = useRef<string | null>(null);

  useEffect(() => {
    if (!token || tokenEnviado.current === token) return;
    tokenEnviado.current = token;
    void verificarCorreo(token).then(setResultado);
  }, [token]);

  if (!token) return <RevisaTuBandeja correo={correo} />;
  if (!resultado) {
    return (
      <div role="status" aria-label="Verificando el enlace">
        <Skeleton className="h-64 w-[400px] max-w-full rounded-xl" />
      </div>
    );
  }
  if (resultado === "activada") return <CuentaActivada />;
  if (resultado === "no-valido") return <EnlaceNoValido token={token} />;
  if (resultado === "no-activada") return <CuentaNoActivada />;
  return <ErrorVerificacion />;
}

function TarjetaEstado({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <Card className="flex w-[400px] max-w-full flex-col gap-4 p-7" role="status">
      <span className="grid size-11 place-items-center rounded-lg border border-border [&_svg]:size-5">{icono}</span>
      <h1 className="text-xl font-semibold tracking-[-0.02em]">{titulo}</h1>
      {children}
    </Card>
  );
}

function RevisaTuBandeja({ correo }: { correo: string | null }) {
  const [correoReal, setCorreoReal] = useState<string | null>(null);
  // Solo en el navegador: el correo real lo guardó 01b en esta pestaña (lib/correo-pendiente).
  useEffect(() => setCorreoReal(leerCorreoPendiente()), []);
  return (
    <TarjetaEstado icono={<Mail aria-hidden />} titulo="Revisa tu bandeja">
      <p className="text-muted-foreground">
        Enviamos un enlace de verificación
        {correo ? (
          <>
            {" "}a <span className="font-medium text-foreground">{correo}</span>
          </>
        ) : null}
        . Caduca en 24 horas.
      </p>
      <p className="text-sm text-muted-foreground">¿No llegó? Revisa spam o promociones.</p>
      {correoReal ? <BotonReenviar destino={{ correo: correoReal }} /> : null}
    </TarjetaEstado>
  );
}

function CuentaActivada() {
  return (
    <TarjetaEstado icono={<CircleCheck className="text-ok" aria-hidden />} titulo="Cuenta activada">
      <p className="text-muted-foreground">
        Tu correo quedó verificado. Ya puedes iniciar sesión y crear tu primer proyecto.
      </p>
      <Button asChild size="lg" className="w-full">
        <Link href="/ingresar">
          Iniciar sesión
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </TarjetaEstado>
  );
}

/** 02 (c): se reenvía con el token vencido del enlace; la API encuentra la cuenta (M1-04). */
function EnlaceNoValido({ token }: { token: string }) {
  return (
    <TarjetaEstado icono={<Link2Off className="text-bad" aria-hidden />} titulo="El enlace ya no es válido">
      <p className="text-muted-foreground">
        Caducó o ya se usó. Los enlaces de verificación duran 24 horas y sirven una sola vez.
      </p>
      <BotonReenviar destino={{ token }} />
      <Button asChild variant="outline" size="lg" className="w-full">
        <Link href="/ingresar">Volver a iniciar sesión</Link>
      </Button>
    </TarjetaEstado>
  );
}

/** El enlace era válido, pero la cuenta no quedó activa (p. ej. suspendida por administración). */
function CuentaNoActivada() {
  return (
    <TarjetaEstado icono={<TriangleAlert className="text-warn" aria-hidden />} titulo="Tu cuenta no está activa">
      <p className="text-muted-foreground">
        Confirmamos tu correo, pero la cuenta no puede usarse ahora. Escríbenos a soporte@deploya.app.
      </p>
    </TarjetaEstado>
  );
}

function ErrorVerificacion() {
  return (
    <TarjetaEstado icono={<TriangleAlert className="text-warn" aria-hidden />} titulo="No pudimos verificar el enlace">
      <p className="text-muted-foreground">La API no respondió. Vuelve a abrir el enlace en unos segundos.</p>
    </TarjetaEstado>
  );
}
