"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { contrasenaValida, RequisitosContrasena } from "@/components/deploya/requisitos-contrasena";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { restablecerContrasena } from "@/lib/api-identidad";
import { DESTINO_TRAS_RESTABLECER, erroresContrasenaNueva, type ErroresRegistro } from "@/lib/cuenta";

import { EnlaceNoSirve, TarjetaRecuperacion } from "../recuperar/tarjeta-recuperacion";

/** Pantalla 04 · paso 2 (`/restablecer?token=`) y el estado «Este enlace ya no sirve». */
export function FormularioRestablecer() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<Omit<ErroresRegistro, "correo">>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enlaceNoSirve, setEnlaceNoSirve] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!token || enlaceNoSirve) return <EnlaceNoSirve />;
  const tokenDelEnlace = token;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nuevos = erroresContrasenaNueva({ contrasena, confirmacion }, contrasenaValida(contrasena));
    setErrores(nuevos);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    const resultado = await restablecerContrasena(tokenDelEnlace, contrasena, confirmacion);
    if (resultado.tipo === "restablecida") {
      router.replace(DESTINO_TRAS_RESTABLECER);
      return;
    }
    setEnviando(false);
    if (resultado.tipo === "enlace-no-sirve") setEnlaceNoSirve(true);
    else setErrorGeneral(resultado.mensaje);
  }

  return (
    <form onSubmit={enviar} noValidate aria-busy={enviando} className="w-[400px] max-w-full">
      <TarjetaRecuperacion icono={<Lock aria-hidden />} titulo="Nueva contraseña">
        {errorGeneral ? <Banner variant="bad" title={errorGeneral} /> : null}
        <Field id="contrasena" label="Nueva contraseña" error={errores.contrasena}>
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
              Guardando…
            </>
          ) : (
            "Guardar contraseña"
          )}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden />
          Enlace de un solo uso · cierra tus otras sesiones
        </p>
      </TarjetaRecuperacion>
    </form>
  );
}
