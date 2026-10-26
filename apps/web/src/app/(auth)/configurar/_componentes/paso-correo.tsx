"use client";

import { ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { ErrorApi } from "@/lib/api";
import { guardarCorreo, probarCorreo } from "@/lib/api-instalacion";
import {
  CAMPOS_SMTP_VACIOS,
  erroresSmtp,
  OPCIONES_CORREO,
  puedeGuardarCorreo,
  seguridadDePuerto,
  smtpParaApi,
  tiempoDeEntrega,
  type CamposSmtp,
  type ErroresSmtp,
  type ModoCorreo,
} from "@/lib/asistente";

import { MarcoPaso } from "./marco-paso";

type Prueba = { tipo: "llego"; ms: number } | { tipo: "rechazada"; error: string } | null;

/** Paso 4 · «¿Cómo manda correos esta instalación?»: SMTP probado o «Sin correo por ahora». */
export function PasoCorreo({ correoAdministrador, alVolver, alGuardar }: { correoAdministrador: string; alVolver: () => void; alGuardar: () => void }) {
  const [modo, setModo] = useState<ModoCorreo>("smtp");
  const [campos, setCampos] = useState<CamposSmtp>(CAMPOS_SMTP_VACIOS);
  const [errores, setErrores] = useState<ErroresSmtp>({});
  const [probado, setProbado] = useState<CamposSmtp | null>(null);
  const [prueba, setPrueba] = useState<Prueba>(null);
  const [probando, setProbando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const cambiar = (campo: keyof CamposSmtp) => (valor: string) => setCampos((actuales) => ({ ...actuales, [campo]: valor }));

  async function probar() {
    const nuevos = erroresSmtp(campos);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    setProbando(true);
    setPrueba(null);
    try {
      const { ms } = await probarCorreo(smtpParaApi(campos));
      setPrueba({ tipo: "llego", ms });
      setProbado(campos);
    } catch (e) {
      const error = e instanceof ErrorApi && typeof e.detalle.error === "string" ? e.detalle.error : e instanceof Error ? e.message : String(e);
      setPrueba({ tipo: "rechazada", error });
      setProbado(null);
    } finally {
      setProbando(false);
    }
  }

  async function continuar() {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await guardarCorreo(modo === "sin-correo" ? { sinCorreo: true } : { smtp: smtpParaApi(campos) });
      alGuardar();
    } catch (e) {
      setErrorGuardar(e instanceof ErrorApi ? e.message : "No pudimos guardar el correo. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  const ocupado = probando || guardando;

  return (
    <MarcoPaso
      titulo="¿Cómo manda correos esta instalación?"
      descripcion="Deploya manda la verificación de cuenta, la recuperación de contraseña y los avisos de despliegue."
      acciones={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={alVolver} disabled={ocupado}>
            Atrás
          </Button>
          <Button type="button" size="sm" onClick={() => void continuar()} disabled={ocupado || !puedeGuardarCorreo(modo, campos, probado)}>
            {guardando ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Continuar
            <ArrowRight aria-hidden />
          </Button>
        </>
      }
    >
      <Segmented
        aria-label="Cómo manda correos"
        value={modo}
        onValueChange={setModo}
        options={OPCIONES_CORREO.map((o) => ({ value: o.valor, label: o.texto }))}
        className="self-start"
      />
      {errorGuardar ? <Banner variant="bad" title={errorGuardar} /> : null}

      {modo === "smtp" ? (
        <Card className="flex flex-col gap-4 p-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
            <Campo id="host" etiqueta="Servidor" valor={campos.host} error={errores.host} alCambiar={cambiar("host")} placeholder="smtp.miempresa.com" deshabilitado={ocupado} />
            <Campo
              id="puerto"
              etiqueta="Puerto"
              valor={campos.puerto}
              error={errores.puerto}
              sufijo={seguridadDePuerto(campos.puerto)}
              alCambiar={cambiar("puerto")}
              placeholder="587"
              inputMode="numeric"
              deshabilitado={ocupado}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="usuario" etiqueta="Usuario" valor={campos.usuario} alCambiar={cambiar("usuario")} placeholder="deploya@miempresa.com" deshabilitado={ocupado} />
            <Campo id="contrasena-smtp" etiqueta="Contraseña" tipo="password" valor={campos.contrasena} alCambiar={cambiar("contrasena")} placeholder="••••••••••••" deshabilitado={ocupado} />
          </div>
          <Campo
            id="remitente"
            etiqueta="Remitente"
            valor={campos.remitente}
            error={errores.remitente}
            alCambiar={cambiar("remitente")}
            placeholder="deploya <no-responder@miempresa.com>"
            deshabilitado={ocupado}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => void probar()} disabled={ocupado}>
              {probando ? <Loader2 className="animate-spin" aria-hidden /> : <Mail aria-hidden />}
              Enviar correo de prueba
            </Button>
            {prueba?.tipo === "llego" ? (
              <span className="flex items-center gap-1.5 text-sm" role="status">
                <MailCheck className="size-4 text-ok" aria-hidden />
                Llegó a <span className="font-mono text-[13px]">{correoAdministrador}</span>
                <span className="text-muted-foreground">{tiempoDeEntrega(prueba.ms)}</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Mandamos uno a {correoAdministrador}</span>
            )}
          </div>
          {prueba?.tipo === "rechazada" ? (
            <Banner variant="bad" title="El servidor no aceptó el correo">
              <span className="font-mono text-[13px] break-words">{prueba.error}</span> Corrige los datos o elige «Sin correo por ahora».
            </Banner>
          ) : null}
        </Card>
      ) : (
        <Banner title="Sin correo, deploya sigue funcionando">
          Las cuentas nuevas se verifican desde Admin · Usuarios, los enlaces de recuperación los genera el administrador y los avisos de
          despliegue solo se ven en la app. Puedes configurarlo después en Instalación.
        </Banner>
      )}
    </MarcoPaso>
  );
}

function Campo({
  id,
  etiqueta,
  valor,
  alCambiar,
  error,
  sufijo,
  placeholder,
  tipo = "text",
  inputMode,
  deshabilitado,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  error?: string;
  /** Texto dentro del campo, a la derecha (artboard 31: «STARTTLS» en Puerto). */
  sufijo?: string;
  placeholder?: string;
  tipo?: "text" | "password";
  inputMode?: "numeric";
  deshabilitado: boolean;
}) {
  return (
    <Field id={id} label={etiqueta} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={tipo}
          autoComplete="off"
          spellCheck={false}
          inputMode={inputMode}
          placeholder={placeholder}
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          disabled={deshabilitado}
          aria-invalid={!!error}
          aria-describedby={`${id}-msg`}
          className={sufijo ? "pr-20 font-mono" : "font-mono"}
        />
        {sufijo ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-muted-foreground">{sufijo}</span>
        ) : null}
      </div>
    </Field>
  );
}
