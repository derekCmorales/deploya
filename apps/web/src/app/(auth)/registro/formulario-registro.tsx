"use client";

import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { contrasenaValida, RequisitosContrasena } from "@/components/deploya/requisitos-contrasena";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, Sunken } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registrarCuenta } from "@/lib/api-identidad";
import { guardarCorreoPendiente } from "@/lib/correo-pendiente";
import { erroresRegistro, type ErroresRegistro } from "@/lib/cuenta";

type Estado =
  | { fase: "editando" }
  | { fase: "enviando" }
  | { fase: "creada"; correoEnmascarado: string; correoEnviado: boolean };

/** Pantalla 01 y sus estados 01b: correo ya registrado, enviando y cuenta creada. */
export function FormularioRegistro() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [correoRegistrado, setCorreoRegistrado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>({ fase: "editando" });

  if (estado.fase === "creada") {
    return <CuentaCreada correoEnmascarado={estado.correoEnmascarado} correoEnviado={estado.correoEnviado} />;
  }

  const enviando = estado.fase === "enviando";

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nuevos = erroresRegistro({ correo, contrasena, confirmacion }, contrasenaValida(contrasena));
    setErrores(nuevos);
    setCorreoRegistrado(false);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) return;

    setEstado({ fase: "enviando" });
    const resultado = await registrarCuenta(correo, contrasena, confirmacion);
    if (resultado.tipo === "creada") {
      guardarCorreoPendiente(correo);
      setEstado({ fase: "creada", correoEnmascarado: resultado.correoEnmascarado, correoEnviado: resultado.correoEnviado });
      return;
    }
    setEstado({ fase: "editando" });
    if (resultado.tipo === "correo-registrado") setCorreoRegistrado(true);
    else setErrorGeneral(resultado.mensaje);
  }

  const errorCorreo = correoRegistrado ? (
    <span>
      Este correo ya tiene una cuenta.{" "}
      <Link href="/ingresar" className="underline underline-offset-[3px]">
        Iniciar sesión
      </Link>{" "}
      o{" "}
      <Link href="/recuperar" className="underline underline-offset-[3px]">
        recuperar contraseña
      </Link>
    </span>
  ) : (
    errores.correo
  );

  return (
    <form className="flex w-[400px] max-w-full flex-col gap-5" onSubmit={enviar} noValidate aria-busy={enviando}>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">Crear cuenta</p>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Empieza a desplegar</h1>
        <p className="text-muted-foreground">Arrancas en Sandbox: sin costo y sin tarjeta.</p>
      </div>

      {errorGeneral ? <Banner variant="bad" title={errorGeneral} /> : null}

      <Field id="correo" label="Correo" error={errorCorreo}>
        <Input
          id="correo"
          type="email"
          autoComplete="email"
          placeholder="derek@tiendademo.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          disabled={enviando}
          aria-invalid={!!errorCorreo}
          aria-describedby="correo-msg"
        />
      </Field>

      <Field id="contrasena" label="Contraseña" error={errores.contrasena}>
        <Input
          id="contrasena"
          type="password"
          autoComplete="new-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          disabled={enviando}
          aria-invalid={!!errores.contrasena}
          aria-describedby="contrasena-msg requisitos"
        />
        <RequisitosContrasena id="requisitos" valor={contrasena} />
      </Field>

      <Field id="confirmacion" label="Confirmar contraseña" error={errores.confirmacion}>
        <Input
          id="confirmacion"
          type="password"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          disabled={enviando}
          aria-invalid={!!errores.confirmacion}
          aria-describedby="confirmacion-msg"
        />
      </Field>

      <Button size="lg" className="w-full" type="submit" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Creando cuenta…
          </>
        ) : (
          <>
            Crear cuenta
            <ArrowRight aria-hidden />
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Al crearla, la cuenta queda <span className="font-medium text-foreground">pendiente de verificación</span> hasta
        que confirmes tu correo.
      </p>

      <p className="flex items-center justify-between gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        ¿Ya tienes cuenta?
        <Button asChild variant="outline" size="sm">
          <Link href="/ingresar">Ya tengo cuenta</Link>
        </Button>
      </p>
    </form>
  );
}

function CuentaCreada({ correoEnmascarado, correoEnviado }: { correoEnmascarado: string; correoEnviado: boolean }) {
  const destino = `/verificar?correo=${encodeURIComponent(correoEnmascarado)}`;
  return (
    <Card className="flex w-[400px] max-w-full flex-col gap-4 p-7" role="status">
      <span className="grid size-11 place-items-center rounded-lg border border-border">
        <MailCheck className="size-5" aria-hidden />
      </span>
      <h2 className="text-xl font-semibold tracking-[-0.02em]">Cuenta creada</h2>
      <p className="text-muted-foreground">
        Te enviamos un enlace a <span className="font-medium text-foreground">{correoEnmascarado}</span>. La cuenta se
        activa al abrirlo.
      </p>
      {correoEnviado ? null : (
        <Banner variant="warn" title="No pudimos enviar el correo ahora.">
          Escríbenos a soporte@deploya.app para activar tu cuenta.
        </Banner>
      )}
      <Sunken className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
        Estado de la cuenta
        <Badge variant="warn">Pendiente de verificación</Badge>
      </Sunken>
      <Button asChild size="lg" className="w-full">
        <Link href={destino}>
          Ir a verificar correo
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </Card>
  );
}
