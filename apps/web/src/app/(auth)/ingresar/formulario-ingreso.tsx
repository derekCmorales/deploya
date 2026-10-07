"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, Sunken } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSesion } from "@/hooks/use-sesion";
import { iniciarSesion } from "@/lib/api-identidad";
import { destinoTrasIngreso, type ResultadoIngreso } from "@/lib/cuenta";
import { fechaCorta } from "@/lib/fechas";

import { AvisoSesionExpirada } from "./aviso-sesion-expirada";

type Aviso = Exclude<ResultadoIngreso, { tipo: "dentro" }> | null;

/** Pantalla 03 y sus estados 03b: credenciales incorrectas, cuenta sin verificar y suspendida. */
export function FormularioIngreso() {
  const router = useRouter();
  const parametros = useSearchParams();
  const destino = destinoTrasIngreso(parametros.get("siguiente"));
  const restablecida = parametros.get("restablecida") === "1";
  const { recargar } = useSesion();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [aviso, setAviso] = useState<Aviso>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso(null);
    setEnviando(true);
    const resultado = await iniciarSesion(correo, contrasena);
    if (resultado.tipo === "dentro") {
      await recargar();
      router.replace(destino);
      return;
    }
    setEnviando(false);
    setAviso(resultado);
  }

  if (aviso?.tipo === "suspendida") {
    return <CuentaSuspendida motivo={aviso.motivo} desde={aviso.desde} onVolver={() => setAviso(null)} />;
  }

  const credencialesMal = aviso?.tipo === "credenciales";

  return (
    <form className="flex w-[400px] max-w-full flex-col gap-5" onSubmit={enviar} noValidate aria-busy={enviando}>
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">Iniciar sesión</p>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Bienvenido de vuelta</h1>
        <p className="text-muted-foreground">Tus proyectos siguen donde los dejaste.</p>
      </div>

      {restablecida && !aviso ? (
        <Banner title="Contraseña actualizada">Inicia sesión con tu contraseña nueva. Cerramos tus otras sesiones.</Banner>
      ) : null}
      {credencialesMal ? (
        <Banner variant="bad" title="Correo o contraseña incorrectos">
          Revisa los datos e inténtalo de nuevo.
        </Banner>
      ) : null}
      {aviso?.tipo === "sin-verificar" ? (
        <Banner variant="warn" title="Tu cuenta aún no está verificada">
          Abre el enlace que enviamos a <span className="font-medium text-foreground">{aviso.correoEnmascarado}</span> para
          activarla.
        </Banner>
      ) : null}
      {aviso ? null : <AvisoSesionExpirada />}
      {aviso?.tipo === "error" ? <Banner variant="bad" title={aviso.mensaje} /> : null}

      <Field id="correo" label="Correo">
        <Input
          id="correo"
          type="email"
          autoComplete="email"
          placeholder="derek@tiendademo.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          disabled={enviando}
          aria-invalid={credencialesMal}
          required
        />
      </Field>

      <Field
        id="contrasena"
        label="Contraseña"
        action={
          <Link href="/recuperar" className="text-xs text-muted-foreground underline-offset-[3px] hover:underline">
            Olvidé mi contraseña
          </Link>
        }
      >
        <Input
          id="contrasena"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••••"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          disabled={enviando}
          aria-invalid={credencialesMal}
          required
        />
      </Field>

      <Button size="lg" className="w-full" type="submit" disabled={enviando || !correo || !contrasena}>
        {enviando ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Iniciando sesión…
          </>
        ) : (
          <>
            Iniciar sesión
            <ArrowRight aria-hidden />
          </>
        )}
      </Button>

      <p className="flex items-center justify-between gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        ¿Nuevo en deploya?
        <Button asChild variant="outline" size="sm">
          <Link href="/registro">Crear cuenta</Link>
        </Button>
      </p>
    </form>
  );
}

/** 03b · Suspendida: el motivo y la fecha los registró M9; si no constan, no se inventan. */
function CuentaSuspendida({ motivo, desde, onVolver }: { motivo: string | null; desde: string | null; onVolver: () => void }) {
  const fecha = desde ? fechaCorta(desde) : null;
  return (
    <Card className="flex w-[400px] max-w-full flex-col gap-4 p-7" role="alert">
      <h1 className="text-xl font-semibold tracking-[-0.02em]">Cuenta suspendida por administración</h1>
      <p className="text-muted-foreground">
        No puedes iniciar sesión mientras dure la suspensión. Tus proyectos y datos se conservan.
      </p>
      {motivo ? (
        <Sunken className="flex flex-col gap-1 px-3 py-2.5 text-sm">
          <span className="text-xs text-muted-foreground">Motivo registrado</span>
          <span className="text-foreground">{motivo}</span>
          {fecha ? <span className="font-mono text-xs text-muted-foreground">{fecha}</span> : null}
        </Sunken>
      ) : null}
      <Sunken className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
        Escribir a soporte
        <a href="mailto:soporte@deploya.app" className="font-mono text-[13px] text-foreground">
          soporte@deploya.app
        </a>
      </Sunken>
      <Button variant="outline" onClick={onVolver}>
        Volver
      </Button>
    </Card>
  );
}
