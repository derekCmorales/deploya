"use client";

import { KeyRound, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { solicitarRecuperacion } from "@/lib/api-identidad";
import { errorCorreoRecuperacion } from "@/lib/cuenta";

import { TarjetaRecuperacion } from "./tarjeta-recuperacion";

type Fase = "editando" | "enviando" | "enviada";

/** Pantalla 04 · paso 1 y su confirmación neutra. */
export function FormularioRecuperacion() {
  const [correo, setCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState(false);
  const [fase, setFase] = useState<Fase>("editando");

  if (fase === "enviada") {
    return (
      <div role="status">
        <TarjetaRecuperacion
          icono={<Mail aria-hidden />}
          titulo="Revisa tu correo"
          descripcion="Si la cuenta existe, te enviamos un enlace. Caduca en 30 minutos y sirve una sola vez."
        >
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/ingresar">Volver a iniciar sesión</Link>
          </Button>
        </TarjetaRecuperacion>
      </div>
    );
  }

  const enviando = fase === "enviando";

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const error = errorCorreoRecuperacion(correo);
    setErrorCorreo(error);
    setErrorGeneral(false);
    if (error) return;

    setFase("enviando");
    const resultado = await solicitarRecuperacion(correo.trim());
    if (resultado === "enviada") {
      setFase("enviada");
      return;
    }
    setFase("editando");
    setErrorGeneral(true);
  }

  return (
    <form onSubmit={enviar} noValidate aria-busy={enviando} className="w-[400px] max-w-full">
      <TarjetaRecuperacion
        icono={<KeyRound aria-hidden />}
        titulo="Recuperar contraseña"
        descripcion="Escribe tu correo y te enviamos un enlace para crear una nueva."
      >
        {errorGeneral ? <Banner variant="bad" title="No pudimos enviar el enlace. Intenta de nuevo en unos segundos." /> : null}
        <Field id="correo" label="Correo" error={errorCorreo ?? undefined}>
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
            required
          />
        </Field>
        <Button size="lg" className="w-full" type="submit" disabled={enviando}>
          {enviando ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Enviando enlace…
            </>
          ) : (
            "Enviar enlace"
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/ingresar" className="underline-offset-[3px] hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </TarjetaRecuperacion>
    </form>
  );
}
