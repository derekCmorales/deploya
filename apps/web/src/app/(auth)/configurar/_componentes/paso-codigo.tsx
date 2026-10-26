"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ErrorApi } from "@/lib/api";
import { validarCodigo } from "@/lib/api-instalacion";
import { mensajeCodigo, normalizarCodigo } from "@/lib/asistente";

import { MarcoPaso } from "./marco-paso";

/** Paso 1 · el código que imprimió `instalar.sh`. Solo avanza con el 204 de la API. */
export function PasoCodigo({ alValidar }: { alValidar: (codigo: string) => void }) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpio = normalizarCodigo(codigo);
    if (!limpio) {
      setError("Escribe el código.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await validarCodigo(limpio);
      alValidar(limpio);
    } catch (e) {
      setError(e instanceof ErrorApi ? mensajeCodigo(e.codigo, e.detalle) : mensajeCodigo(""));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate aria-busy={enviando}>
      <MarcoPaso
        titulo="Código de configuración"
        descripcion="Lo imprimió ./scripts/instalar.sh al terminar. Sirve una vez y vence a los 30 minutos."
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
        <Card className="flex flex-col gap-4 p-5">
          <Field id="codigo" label="Código" error={error}>
            <Input
              id="codigo"
              className="font-mono uppercase"
              autoComplete="one-time-code"
              spellCheck={false}
              placeholder="XXXX-XXXX"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              disabled={enviando}
              aria-invalid={!!error}
              aria-describedby="codigo-msg"
            />
          </Field>
        </Card>
      </MarcoPaso>
    </form>
  );
}
