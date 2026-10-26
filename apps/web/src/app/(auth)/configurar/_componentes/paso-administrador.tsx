"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { contrasenaValida, RequisitosContrasena } from "@/components/deploya/requisitos-contrasena";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ErrorApi } from "@/lib/api";
import { crearAdministrador } from "@/lib/api-instalacion";
import { mensajeCodigo } from "@/lib/asistente";
import { erroresRegistro, type ErroresRegistro } from "@/lib/cuenta";

import { MarcoPaso } from "./marco-paso";

const CODIGOS_DEL_CODIGO = ["CodigoInvalido", "CodigoVencido", "DemasiadosIntentosCodigo", "PrimeraConfiguracionNoDisponible"];

/** Paso 2 · la cuenta de administrador. La API la crea verificada y deja la sesión iniciada. */
export function PasoAdministrador({ codigo, alCrear }: { codigo: string; alCrear: () => Promise<void> }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nuevos = erroresRegistro({ correo, contrasena, confirmacion }, contrasenaValida(contrasena));
    setErrores(nuevos);
    setErrorGeneral(null);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await crearAdministrador(codigo, correo.trim(), contrasena);
      await alCrear();
    } catch (e) {
      if (e instanceof ErrorApi && CODIGOS_DEL_CODIGO.includes(e.codigo)) setErrorGeneral(mensajeCodigo(e.codigo, e.detalle));
      else if (e instanceof ErrorApi && e.codigo === "CorreoYaRegistrado") setErrores({ correo: "Ese correo ya tiene una cuenta en esta instalación." });
      else setErrorGeneral(e instanceof ErrorApi ? e.message : "No pudimos crear la cuenta. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate aria-busy={enviando}>
      <MarcoPaso
        titulo="Cuenta de administrador"
        descripcion="Con esta cuenta entras a Admin · Instalación. Queda verificada y con la sesión iniciada."
        acciones={
          <>
            <span />
            <Button type="submit" size="sm" disabled={enviando}>
              {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Continuar
              <ArrowRight aria-hidden />
            </Button>
          </>
        }
      >
        {errorGeneral ? <Banner variant="bad" title={errorGeneral} /> : null}
        <Card className="flex flex-col gap-4 p-5">
          <Field id="correo" label="Correo" error={errores.correo}>
            <Input
              id="correo"
              type="email"
              autoComplete="email"
              placeholder="ops@miempresa.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={enviando}
              aria-invalid={!!errores.correo}
              aria-describedby="correo-msg"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="contrasena" label="Contraseña" error={errores.contrasena}>
              <Input
                id="contrasena"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 12 caracteres"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                disabled={enviando}
                aria-invalid={!!errores.contrasena}
                aria-describedby="contrasena-msg requisitos"
              />
              <RequisitosContrasena id="requisitos" valor={contrasena} />
            </Field>
            <Field id="confirmacion" label="Confirmar" error={errores.confirmacion}>
              <Input
                id="confirmacion"
                type="password"
                autoComplete="new-password"
                placeholder="Repite la contraseña"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                disabled={enviando}
                aria-invalid={!!errores.confirmacion}
                aria-describedby="confirmacion-msg"
              />
            </Field>
          </div>
        </Card>
      </MarcoPaso>
    </form>
  );
}
