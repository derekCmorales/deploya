import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import { errorClave, type FilaAlta } from "@/lib/variables";

type Alta = ReturnType<typeof useAltaProyecto>;

/** Paso 2 del asistente: pantalla 11c. El valor viaja en el alta y la API lo cifra. */
export function PasoVariables({ alta }: { alta: Alta }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Paso 2 · Variables</p>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Variables de entorno</h2>
        <p className="text-muted-foreground">Se guardan cifradas y se pasan al contenedor al arrancar. Este paso es opcional.</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">Clave</th>
            <th className="pb-2 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {alta.variables.map((fila, indice) => (
            <Fila key={indice} fila={fila} indice={indice} onClave={(valor) => alta.editarVariable(indice, { clave: valor })} onValor={(valor) => alta.editarVariable(indice, { valor })} />
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={alta.anadirVariable}>
          <Plus />
          Añadir variable
        </Button>
        <p className="text-xs text-muted-foreground">Cifradas en la base de datos</p>
      </div>
      <p className="text-sm text-muted-foreground">
        No declares <span className="font-mono text-foreground">PORT</span>: lo tomamos del paso anterior ({alta.puerto || "8080"}).
      </p>
    </div>
  );
}

function Fila({
  fila,
  indice,
  onClave,
  onValor,
}: {
  fila: FilaAlta;
  indice: number;
  onClave: (valor: string) => void;
  onValor: (valor: string) => void;
}) {
  const error = errorClave(fila.clave);
  return (
    <tr>
      <td className="py-1.5 pr-3">
        <Input className="font-mono" aria-label={`Clave ${indice + 1}`} value={fila.clave} onChange={(e) => onClave(e.target.value)} aria-invalid={error ? true : undefined} />
        {error ? <p className="mt-1 text-xs text-bad">{error}</p> : null}
      </td>
      <td className="py-1.5">
        <Input className="font-mono" type="password" aria-label={`Valor ${indice + 1}`} value={fila.valor} onChange={(e) => onValor(e.target.value)} autoComplete="off" />
      </td>
    </tr>
  );
}
