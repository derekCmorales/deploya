"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { suspenderCuenta, useMotivosSuspension } from "@/hooks/use-admin-usuarios";
import { cuerpoSuspension, DETALLE_MAXIMO, type FilaUsuario } from "@/lib/admin-usuarios";
import { ErrorApi } from "@/lib/api";

/** 25b: motivo de la lista y detalle para el registro; el motivo es lo que verá el usuario en 03b. */
export function DialogoSuspender({
  usuario,
  abierto,
  alCambiar,
  alSuspender,
}: {
  usuario: Pick<FilaUsuario, "id" | "nombre" | "correo">;
  abierto: boolean;
  alCambiar: (abierto: boolean) => void;
  alSuspender: () => void;
}) {
  const motivos = useMotivosSuspension();
  const [motivo, setMotivo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cuerpo = cuerpoSuspension(motivo, detalle);

  const cerrar = (siguiente: boolean) => {
    if (!siguiente) {
      setMotivo("");
      setDetalle("");
      setError(null);
    }
    alCambiar(siguiente);
  };

  const confirmar = async () => {
    if (!cuerpo) return;
    setEnviando(true);
    setError(null);
    try {
      await suspenderCuenta(usuario.id, cuerpo);
      cerrar(false);
      alSuspender();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos suspender la cuenta.");
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
          <ShieldAlert className="size-5 text-bad" aria-hidden />
          Suspender cuenta
        </span>
      }
      description={
        <>
          <span className="font-medium text-foreground">{usuario.correo}</span> no podrá iniciar sesión. Sus contenedores se detienen; el
          código, las variables y el historial se conservan.
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => cerrar(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void confirmar()} disabled={!cuerpo || enviando}>
            <ShieldAlert />
            Suspender cuenta
          </Button>
        </>
      }
    >
      <Field id="motivo-suspension" label="Motivo" hint="Se muestra al usuario cuando intenta iniciar sesión.">
        <Select id="motivo-suspension" aria-describedby="motivo-suspension-msg" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
          <option value="" disabled>
            {motivos.datos ? "Elige un motivo" : "Cargando motivos…"}
          </option>
          {(motivos.datos?.motivos ?? []).map((m) => (
            <option key={m.clave} value={m.clave}>
              {m.texto}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="detalle-suspension" label="Detalle para el registro">
        <Textarea
          id="detalle-suspension"
          rows={3}
          maxLength={DETALLE_MAXIMO}
          placeholder="Tráfico de minería detectado en 2 contenedores."
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
        />
      </Field>
      {error ? (
        <Banner variant="bad" title="No se suspendió la cuenta.">
          {error}
        </Banner>
      ) : null}
    </Dialog>
  );
}
