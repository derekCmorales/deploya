"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useVariablesProyecto } from "@/hooks/use-variables-proyecto";
import { haceCuanto } from "@/lib/proyectos";
import { errorClave, textoCambios, valorVisible, type FilaVariable } from "@/lib/variables";

/** Pantalla 17. Los cambios no tocan el contenedor hasta el próximo despliegue. */
export function PanelVariables({ proyectoId }: { proyectoId: string }) {
  const variables = useVariablesProyecto(proyectoId);
  const [ahora] = useState(() => new Date());
  if (variables.cargando) return <Skeleton className="mx-8 mt-6 h-40" />;

  return (
    <div className="flex flex-col gap-5 px-8 py-6">
      <CambiosPendientes variables={variables} />
      {variables.error ? <Banner variant="bad" title={variables.error} /> : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 font-medium">Clave</th>
            <th className="py-2 font-medium">Valor</th>
            <th className="py-2 text-right font-medium">Actualizada</th>
          </tr>
        </thead>
        <tbody>
          {variables.filas.map((fila, indice) => (
            <Fila
              key={`${fila.clave}-${indice}`}
              fila={fila}
              actualizada={marca(fila, variables.guardadas, ahora)}
              onClave={(valor) => variables.editar(indice, { clave: valor })}
              onValor={(valor) => variables.editar(indice, { valor })}
              onMostrar={() => variables.mostrar(indice)}
            />
          ))}
        </tbody>
      </table>
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={variables.anadir}>
        <Plus />
        Añadir variable
      </Button>
    </div>
  );
}

type Borrador = ReturnType<typeof useVariablesProyecto>;

function CambiosPendientes({ variables }: { variables: Borrador }) {
  if (variables.cambios === 0) return null;
  return (
    <Banner
      variant="warn"
      title={textoCambios(variables.cambios)}
      actions={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={variables.descartar} disabled={variables.ocupado}>
            Descartar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={variables.guardar} disabled={variables.ocupado}>
            Guardar
          </Button>
          <Button type="button" size="sm" onClick={variables.guardarYDesplegar} disabled={variables.ocupado}>
            Guardar y desplegar
          </Button>
        </>
      }
    >
      Se aplican en el próximo despliegue. El contenedor actual sigue con las anteriores.
    </Banner>
  );
}

function Fila({
  fila,
  actualizada,
  onClave,
  onValor,
  onMostrar,
}: {
  fila: FilaVariable;
  actualizada: string;
  onClave: (valor: string) => void;
  onValor: (valor: string) => void;
  onMostrar: () => void;
}) {
  const error = fila.nueva ? errorClave(fila.clave) : null;
  const visible = valorVisible(fila);
  return (
    <tr className="border-b border-border">
      <td className="py-2 pr-3">
        {fila.nueva ? (
          <Input className="font-mono" aria-label="Clave" placeholder="CLAVE" value={fila.clave} aria-invalid={error ? true : undefined} onChange={(e) => onClave(e.target.value)} />
        ) : (
          <span className="font-mono">{fila.clave}</span>
        )}
        {fila.nueva ? <span className="ml-2 text-xs text-muted-foreground">Nueva</span> : null}
        {error ? <p className="mt-1 text-xs text-bad">{error}</p> : null}
      </td>
      <td className="py-2 pr-3">
        {visible ? (
          <Input className="font-mono" aria-label={`Valor de ${fila.clave || "la variable"}`} placeholder="valor" value={fila.valor ?? ""} autoComplete="off" onChange={(e) => onValor(e.target.value)} />
        ) : (
          <span className="font-mono">••••••••••••</span>
        )}
        {fila.nueva ? null : (
          <Button type="button" variant="ghost" size="xs" className="ml-2" onClick={onMostrar}>
            {visible ? "Ocultar" : "Mostrar"}
          </Button>
        )}
      </td>
      <td className="py-2 text-right text-xs text-muted-foreground">{actualizada}</td>
    </tr>
  );
}

function marca(fila: FilaVariable, guardadas: { clave: string; actualizado: string }[], ahora: Date): string {
  if (fila.nueva) return "ahora";
  const fecha = guardadas.find((guardada) => guardada.clave === fila.clave)?.actualizado;
  return fecha ? haceCuanto(fecha, ahora) : "ahora";
}
