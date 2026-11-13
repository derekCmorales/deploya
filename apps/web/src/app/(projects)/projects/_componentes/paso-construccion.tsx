import { CircleCheck, Hammer, Info, Terminal, type LucideIcon } from "lucide-react";

import { Card, Sunken } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import { LARGO_MAXIMO_COMANDO, motivoSinComandoConstruccion, pistaComandoConstruccion } from "@/lib/alta";
import { tituloDeteccion } from "@/lib/proyectos";

type Alta = ReturnType<typeof useAltaProyecto>;

const PISTA_INICIO = "Sobrescribe el CMD de la imagen. Útil para correr un worker con la misma imagen, p. ej. node dist/worker.js";

/** Paso 2 del asistente (feat/m3-alta-guiada): los comandos que antes solo se ponían en Configuración (19). */
export function PasoConstruccion({ alta }: { alta: Alta }) {
  const { validacion, error } = alta;
  if (!validacion) return null;
  const receta = validacion.deteccion?.receta ?? "dockerfile";
  const { titulo, detalle } = tituloDeteccion(validacion);
  const errorDe = (campo: string) => (error?.tipo === "campo" && error.campo === campo ? error.mensaje : undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Paso 2 · Construcción</p>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">¿Cómo se construye y arranca?</h2>
        <p className="text-muted-foreground">Déjalos vacíos para usar lo que detectamos. Los puedes cambiar después en Configuración.</p>
      </div>

      <Card className="flex items-center gap-4 px-4 py-3.5">
        <CircleCheck className="size-[18px] shrink-0 text-ok" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="font-medium">{titulo}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{detalle}</p>
        </div>
      </Card>

      {alta.aplicaComandoConstruccion ? (
        <Comando
          id="comandoConstruccion"
          etiqueta="Comando de construcción (opcional)"
          icono={Hammer}
          valor={alta.comandoConstruccion}
          error={errorDe("comandoConstruccion")}
          pista={pistaComandoConstruccion(receta) ?? undefined}
          placeholder="npm run build:prod"
          alCambiar={alta.cambiarComandoConstruccion}
        />
      ) : (
        <Sunken className="flex items-start gap-3 px-4 py-3.5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">{motivoSinComandoConstruccion(receta)}</p>
        </Sunken>
      )}

      <Comando
        id="comandoInicio"
        etiqueta="Comando de inicio (opcional)"
        icono={Terminal}
        valor={alta.comandoInicio}
        error={errorDe("comandoInicio")}
        pista={PISTA_INICIO}
        placeholder="node dist/main.js"
        alCambiar={alta.cambiarComandoInicio}
      />
    </div>
  );
}

function Comando({
  id,
  etiqueta,
  icono: Icono,
  valor,
  error,
  pista,
  placeholder,
  alCambiar,
}: {
  id: string;
  etiqueta: string;
  icono: LucideIcon;
  valor: string;
  error?: string;
  pista?: string;
  placeholder: string;
  alCambiar: (valor: string) => void;
}) {
  return (
    <Field id={id} label={etiqueta} error={error} hint={pista}>
      <div className="relative">
        <Icono aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={valor}
          className="pl-8 font-mono"
          onChange={(e) => alCambiar(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          maxLength={LARGO_MAXIMO_COMANDO}
          aria-invalid={!!error}
          aria-describedby={`${id}-msg`}
        />
      </div>
    </Field>
  );
}
