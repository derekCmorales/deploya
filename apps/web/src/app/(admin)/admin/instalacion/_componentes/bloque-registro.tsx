"use client";

import { MailPlus } from "lucide-react";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { cambiarRegistro, crearInvitacion, revocarInvitacion } from "@/hooks/use-admin-instalacion";
import { OPCIONES_REGISTRO, textoRegistro, textoVenceInvitacion, type EstadoInstalacion, type PoliticaRegistro } from "@/lib/admin-instalacion";
import { ErrorApi } from "@/lib/api";

import { FilaAjuste } from "./fila-ajuste";

const mensaje = (e: unknown, porDefecto: string) => (e instanceof ErrorApi ? e.message : porDefecto);

/** Registro: abierto · con invitación · cerrado, y las invitaciones activas. */
export function BloqueRegistro({ registro, ahora, alCambiar }: { registro: EstadoInstalacion["registro"]; ahora: Date; alCambiar: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [invitando, setInvitando] = useState(false);

  const elegir = async (politica: PoliticaRegistro) => {
    setError(null);
    try {
      await cambiarRegistro(politica);
      alCambiar();
    } catch (e) {
      setError(mensaje(e, "No pudimos cambiar el registro."));
    }
  };

  const revocar = async (id: string) => {
    setError(null);
    try {
      await revocarInvitacion(id);
      alCambiar();
    } catch (e) {
      setError(mensaje(e, "No pudimos revocar la invitación."));
    }
  };

  return (
    <FilaAjuste titulo="Registro" descripcion="Quién puede crear una cuenta en esta instalación.">
      <Card className="flex flex-col gap-4 p-5">
        <Segmented
          aria-label="Quién puede registrarse"
          className="self-start"
          value={registro.politica}
          onValueChange={(v) => void elegir(v)}
          options={OPCIONES_REGISTRO.map((o) => ({ value: o.valor, label: o.texto }))}
        />
        <p className="text-[13px] text-muted-foreground">{textoRegistro(registro.politica)}</p>
        {registro.politica === "invitacion" ? (
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[13px] font-medium">Invitaciones activas</span>
              <Button variant="outline" size="xs" onClick={() => setInvitando(true)}>
                <MailPlus />
                Crear invitación
              </Button>
            </div>
            {registro.invitaciones.length === 0 ? (
              <p className="border-t border-border py-2.5 text-[13px] text-muted-foreground">No hay invitaciones activas.</p>
            ) : (
              <ul className="flex flex-col">
                {registro.invitaciones.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 border-t border-border py-2.5">
                    <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{i.correo}</span>
                    <span className="text-[13px] text-muted-foreground">{textoVenceInvitacion(i.vence, ahora)}</span>
                    <Button variant="ghost" size="xs" onClick={() => void revocar(i.id)}>
                      Revocar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
        {error ? (
          <Banner variant="bad" title="No se guardó el cambio.">
            {error}
          </Banner>
        ) : null}
      </Card>
      <DialogoInvitar abierto={invitando} alCambiar={setInvitando} alCrear={alCambiar} />
    </FilaAjuste>
  );
}

/** Crear invitación: el enlace se muestra una sola vez (en la base solo queda su huella). */
function DialogoInvitar({ abierto, alCambiar, alCrear }: { abierto: boolean; alCambiar: (abierto: boolean) => void; alCrear: () => void }) {
  const [correo, setCorreo] = useState("");
  const [enlace, setEnlace] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cerrar = (siguiente: boolean) => {
    if (!siguiente) {
      setCorreo("");
      setEnlace(null);
      setError(null);
    }
    alCambiar(siguiente);
  };

  const crear = async () => {
    setEnviando(true);
    setError(null);
    try {
      setEnlace((await crearInvitacion(correo)).enlace);
      alCrear();
    } catch (e) {
      setError(mensaje(e, "No pudimos crear la invitación."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog
      open={abierto}
      onOpenChange={cerrar}
      title="Crear invitación"
      description="El enlace sirve una vez y vence en 7 días. Cópialo ahora: no lo volvemos a mostrar."
      footer={
        enlace ? (
          <Button onClick={() => cerrar(false)}>Listo</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => cerrar(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button onClick={() => void crear()} disabled={!correo.trim() || enviando}>
              <MailPlus />
              Crear invitación
            </Button>
          </>
        )
      }
    >
      {enlace ? (
        <CopyField value={enlace} label="Copiar enlace" />
      ) : (
        <Field id="correo-invitacion" label="Correo">
          <Input id="correo-invitacion" type="email" placeholder="ana@miempresa.com" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </Field>
      )}
      {error ? (
        <Banner variant="bad" title="No se creó la invitación.">
          {error}
        </Banner>
      ) : null}
    </Dialog>
  );
}
