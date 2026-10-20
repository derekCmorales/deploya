"use client";

import { Eye, EyeOff, KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { contrasenaValida } from "@/components/deploya/requisitos-contrasena";
import { RUTA_INGRESAR } from "@/components/shell/menu-usuario";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSesion } from "@/hooks/use-sesion";
import { cambiarContrasena, cerrarTodasLasSesiones } from "@/lib/api-cuenta";
import { erroresContrasena, type ErroresContrasena } from "@/lib/mi-cuenta";

import { FilaCuenta } from "./fila-cuenta";

/**
 * Pantalla 05b · Mi cuenta · Seguridad (M1-07). «Último cambio» no se muestra: no hay
 * columna para esa fecha (change feat-m1-cuenta, design.md decisión 5).
 */
export function Seguridad() {
  return (
    <div className="flex flex-col">
      <FilaCuenta titulo="Contraseña" descripcion="Al cambiarla cerramos tus sesiones en otros dispositivos.">
        <FormularioContrasena />
      </FilaCuenta>
      <FilaCuenta titulo="Sesiones" descripcion="Si perdiste un dispositivo o dejaste tu cuenta abierta en otro lado.">
        <CerrarTodas />
      </FilaCuenta>
    </div>
  );
}

function ConIcono({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <div className="relative [&>input]:pl-8">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">{icono}</span>
      {children}
    </div>
  );
}

function FormularioContrasena() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [verActual, setVerActual] = useState(false);
  const [errores, setErrores] = useState<ErroresContrasena>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [cambiada, setCambiada] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nuevos = erroresContrasena({ actual, nueva, confirmacion }, contrasenaValida(nueva));
    setErrores(nuevos);
    setErrorGeneral(null);
    setCambiada(false);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    const resultado = await cambiarContrasena(actual, nueva).catch(() => null);
    setEnviando(false);
    if (resultado?.tipo === "cambiada") {
      setActual("");
      setNueva("");
      setConfirmacion("");
      setCambiada(true);
      return;
    }
    if (resultado?.tipo === "actual-incorrecta") setErrores({ actual: "La contraseña actual no es correcta." });
    else setErrorGeneral(resultado?.mensaje ?? "No pudimos cambiar la contraseña. Intenta de nuevo en unos segundos.");
  }

  return (
    <Card className="overflow-hidden">
      <form onSubmit={enviar} noValidate aria-busy={enviando}>
        <div className="flex flex-col gap-4 p-4">
          {cambiada ? (
            <Banner title="Contraseña actualizada">Cerramos tus sesiones en otros dispositivos; esta sigue abierta.</Banner>
          ) : null}
          {errorGeneral ? <Banner variant="bad" title={errorGeneral} /> : null}

          <Field id="actual" label="Contraseña actual" error={errores.actual}>
            <div className="relative">
              <ConIcono icono={<KeyRound aria-hidden />}>
                <Input
                  id="actual"
                  type={verActual ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••••"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  disabled={enviando}
                  aria-invalid={!!errores.actual}
                  aria-describedby="actual-msg"
                  className="pr-9"
                />
              </ConIcono>
              <button
                type="button"
                onClick={() => setVerActual((v) => !v)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground [&>svg]:size-4"
                aria-label={verActual ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {verActual ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </button>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="nueva" label="Nueva contraseña" error={errores.nueva}>
              <ConIcono icono={<KeyRound aria-hidden />}>
                <Input
                  id="nueva"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 12 caracteres"
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  disabled={enviando}
                  aria-invalid={!!errores.nueva}
                  aria-describedby="nueva-msg"
                />
              </ConIcono>
            </Field>
            <Field id="confirmacion" label="Confirmar" error={errores.confirmacion}>
              <ConIcono icono={<KeyRound aria-hidden />}>
                <Input
                  id="confirmacion"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repite la nueva"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                  disabled={enviando}
                  aria-invalid={!!errores.confirmacion}
                  aria-describedby="confirmacion-msg"
                />
              </ConIcono>
            </Field>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border px-4 py-3">
          <Button type="submit" size="sm" disabled={enviando}>
            {enviando ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Card>
  );
}

/**
 * «Cerrar todas»: primero se confirma en un diálogo (el escenario dice «confirma»); después la
 * API revoca todas las sesiones y vence la cookie, y la web vuelve a 03.
 */
function CerrarTodas() {
  const router = useRouter();
  const { salir } = useSesion();
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cerrar() {
    setCerrando(true);
    setError(null);
    try {
      await cerrarTodasLasSesiones();
      await salir();
      router.replace(RUTA_INGRESAR);
    } catch {
      setCerrando(false);
      setConfirmando(false);
      setError("No pudimos cerrar las sesiones. Intenta de nuevo.");
    }
  }

  function cambiarConfirmacion(abierto: boolean) {
    if (!cerrando) setConfirmando(abierto);
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium">Cerrar sesión en todos los dispositivos</span>
          <span className="text-xs text-muted-foreground">
            Invalida todas tus sesiones, incluida esta. Tendrás que volver a iniciar sesión.
          </span>
        </div>
        <Button
          type="button"
          variant="destructive-outline"
          size="sm"
          onClick={() => setConfirmando(true)}
          disabled={cerrando}
        >
          <LogOut aria-hidden />
          Cerrar todas
        </Button>
      </div>
      <Dialog
        open={confirmando}
        onOpenChange={cambiarConfirmacion}
        title="Cerrar sesión en todos los dispositivos"
        description="Invalida todas tus sesiones, incluida esta. Tendrás que volver a iniciar sesión."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => cambiarConfirmacion(false)} disabled={cerrando}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => void cerrar()} disabled={cerrando}>
              {cerrando ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
              Cerrar todas
            </Button>
          </>
        }
      />
      {error ? (
        <p className="text-xs text-bad" role="alert">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
