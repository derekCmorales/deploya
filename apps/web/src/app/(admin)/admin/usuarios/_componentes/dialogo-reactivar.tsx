"use client";

import { UserCheck } from "lucide-react";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { reactivarCuenta } from "@/hooks/use-admin-usuarios";
import { avisoReactivacion, cuerpoReactivacion, DETALLE_MAXIMO, type DetalleUsuario } from "@/lib/admin-usuarios";
import { ErrorApi } from "@/lib/api";

/** 25c: explica qué pasa al reactivar y avisa si la suscripción sigue sin vigencia. */
export function DialogoReactivar({
  usuario,
  abierto,
  alCambiar,
  alReactivar,
}: {
  usuario: Pick<DetalleUsuario, "id" | "correo" | "plan" | "suscripcion" | "suspension">;
  abierto: boolean;
  alCambiar: (abierto: boolean) => void;
  alReactivar: () => void;
}) {
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aviso = avisoReactivacion(usuario);

  const cerrar = (siguiente: boolean) => {
    if (!siguiente) {
      setDetalle("");
      setError(null);
    }
    alCambiar(siguiente);
  };

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await reactivarCuenta(usuario.id, cuerpoReactivacion(detalle));
      cerrar(false);
      alReactivar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos reactivar la cuenta.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={cerrar}
      title={
        <span className="flex items-center gap-2">
          <UserCheck className="size-5 text-ok" aria-hidden />
          Reactivar cuenta
        </span>
      }
      description={
        <>
          <span className="font-medium text-foreground">{usuario.correo}</span> podrá iniciar sesión otra vez. Quitamos el motivo de la
          suspensión y queda registro de la acción.
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => cerrar(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={() => void confirmar()} disabled={enviando}>
            <UserCheck />
            Reactivar cuenta
          </Button>
        </>
      }
    >
      {aviso ? (
        <Banner variant="warn" title={aviso.titulo}>
          {aviso.texto}
        </Banner>
      ) : null}
      <Field id="detalle-reactivacion" label="Detalle para el registro">
        <Textarea
          id="detalle-reactivacion"
          rows={3}
          maxLength={DETALLE_MAXIMO}
          placeholder="Aclarado con la clienta: el tráfico era de pruebas de carga."
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        />
      </Field>
      {error ? (
        <Banner variant="bad" title="No se reactivó la cuenta.">
          {error}
        </Banner>
      ) : null}
    </Dialog>
  );
}
