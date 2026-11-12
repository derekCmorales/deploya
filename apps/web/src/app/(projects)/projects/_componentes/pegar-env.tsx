"use client";

import { ClipboardPaste } from "lucide-react";
import { useMemo, useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { MAXIMO_VARIABLES, parsearEnv, textoResumenPegado, totalTrasPegar, type FilaAlta, type FilaVariable } from "@/lib/variables";

const FILAS_TEXTO = 12;
const RECHAZADAS_VISIBLES = 5;

/**
 * «Pegar .env» de 17: pega un archivo `CLAVE=valor` completo y lo suma al borrador. No guarda: el banner de
 * cambios sin aplicar sigue mandando (Guardar · Guardar y desplegar).
 */
export function PegarEnv({ filas, onPegar }: { filas: readonly FilaVariable[]; onPegar: (pegadas: readonly FilaAlta[]) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const leido = useMemo(() => parsearEnv(texto), [texto]);
  const total = totalTrasPegar(filas, leido.variables);
  const excede = total > MAXIMO_VARIABLES;

  const cambiarApertura = (valor: boolean) => {
    setAbierto(valor);
    setTexto("");
  };

  const agregar = () => {
    onPegar(leido.variables);
    cambiarApertura(false);
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setAbierto(true)}>
        <ClipboardPaste />
        Pegar .env
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={cambiarApertura}
        className="w-[min(640px,calc(100vw-32px))]"
        title="Pegar .env"
        description="Una variable por línea, CLAVE=valor. Ignoramos líneas vacías y comentarios con #, y quitamos las comillas."
        footer={
          <>
            <Button variant="ghost" onClick={() => cambiarApertura(false)}>
              Cancelar
            </Button>
            <Button onClick={agregar} disabled={leido.variables.length === 0 || excede}>
              Agregar al borrador
            </Button>
          </>
        }
      >
        <Field id="pegar-env" label="Contenido del .env" hint={leido.variables.length > 0 ? `${textoResumenPegado(filas, leido.variables)}.` : undefined}>
          <Textarea
            id="pegar-env"
            rows={FILAS_TEXTO}
            className="font-mono text-[13px]"
            placeholder={"DATABASE_URL=postgres://…\nNODE_ENV=production"}
            value={texto}
            spellCheck={false}
            autoComplete="off"
            aria-describedby="pegar-env-msg"
            onChange={(e) => setTexto(e.target.value)}
          />
        </Field>
        {excede ? (
          <Banner variant="bad" title={`Quedarían ${total} variables`}>
            El máximo es {MAXIMO_VARIABLES} por proyecto.
          </Banner>
        ) : null}
        {leido.rechazadas.length > 0 ? (
          <Banner variant="warn" title={leido.rechazadas.length === 1 ? "1 línea no se agrega" : `${leido.rechazadas.length} líneas no se agregan`}>
            <ul className="flex flex-col gap-0.5 font-mono text-xs">
              {leido.rechazadas.slice(0, RECHAZADAS_VISIBLES).map((r) => (
                <li key={r.linea}>
                  Línea {r.linea} · {r.motivo}
                </li>
              ))}
            </ul>
          </Banner>
        ) : null}
      </Dialog>
    </>
  );
}
