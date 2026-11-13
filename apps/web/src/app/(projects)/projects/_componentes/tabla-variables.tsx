import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorClave, valorVisible, type FilaVariable } from "@/lib/variables";

interface ColumnaExtra {
  titulo: string;
  celda: (fila: FilaVariable, indice: number) => ReactNode;
}

/**
 * Tabla clave/valor de la pestaña Variables (17) y del paso Variables del alta (feat/m3-alta-guiada).
 * Presentacional: no sabe si edita variables guardadas o el borrador del alta. Con `enmascarar`, una fila
 * nueva también se puede ocultar (en el alta todas son nuevas).
 */
export function TablaVariables({
  filas,
  onClave,
  onValor,
  onMostrar,
  onQuitar,
  enmascarar = false,
  insignia,
  extra,
}: {
  filas: readonly FilaVariable[];
  onClave: (indice: number, valor: string) => void;
  onValor: (indice: number, valor: string) => void;
  onMostrar: (indice: number) => void;
  onQuitar?: (indice: number) => void;
  enmascarar?: boolean;
  insignia?: (fila: FilaVariable) => ReactNode;
  extra?: ColumnaExtra;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="py-2 font-medium">Clave</th>
          <th className="py-2 font-medium">Valor</th>
          {extra ? <th className="py-2 text-right font-medium">{extra.titulo}</th> : null}
          {onQuitar ? <th className="w-10 py-2" aria-label="Acciones" /> : null}
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, indice) => (
          <tr key={indice} className="border-b border-border align-top">
            <td className="py-2 pr-3">
              <CeldaClave fila={fila} indice={indice} onClave={(valor) => onClave(indice, valor)} insignia={insignia?.(fila)} />
            </td>
            <td className="py-2 pr-3">
              <CeldaValor fila={fila} enmascarar={enmascarar} onValor={(valor) => onValor(indice, valor)} onMostrar={() => onMostrar(indice)} />
            </td>
            {extra ? <td className="py-2 text-right text-xs text-muted-foreground">{extra.celda(fila, indice)}</td> : null}
            {onQuitar ? (
              <td className="py-2 text-right">
                <Button type="button" variant="ghost" size="xs" onClick={() => onQuitar(indice)} aria-label={`Quitar ${fila.clave || "la variable"}`}>
                  <Trash2 />
                </Button>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CeldaClave({ fila, indice, onClave, insignia }: { fila: FilaVariable; indice: number; onClave: (valor: string) => void; insignia: ReactNode }) {
  const error = fila.nueva ? errorClave(fila.clave) : null;
  return (
    <>
      {fila.nueva ? (
        <Input
          className="font-mono"
          aria-label={`Clave ${indice + 1}`}
          placeholder="CLAVE"
          value={fila.clave}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          onChange={(e) => onClave(e.target.value)}
        />
      ) : (
        <span className="font-mono">{fila.clave}</span>
      )}
      {insignia ? <span className="mt-1 block">{insignia}</span> : null}
      {error ? <p className="mt-1 text-xs text-bad">{error}</p> : null}
    </>
  );
}

function CeldaValor({
  fila,
  enmascarar,
  onValor,
  onMostrar,
}: {
  fila: FilaVariable;
  enmascarar: boolean;
  onValor: (valor: string) => void;
  onMostrar: () => void;
}) {
  const visible = valorVisible(fila);
  const conBoton = !fila.nueva || enmascarar;
  const textoBoton = fila.nueva ? (fila.oculta ? "Mostrar" : "Ocultar") : visible ? "Ocultar" : "Mostrar";
  return (
    <div className="flex items-center gap-2">
      {visible ? (
        <Input
          className="font-mono"
          type={fila.nueva && fila.oculta ? "password" : "text"}
          aria-label={`Valor de ${fila.clave || "la variable"}`}
          placeholder="valor"
          value={fila.valor ?? ""}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onValor(e.target.value)}
        />
      ) : (
        <span className="font-mono">••••••••••••</span>
      )}
      {conBoton ? (
        <Button type="button" variant="ghost" size="xs" onClick={onMostrar}>
          {textoBoton}
        </Button>
      ) : null}
    </div>
  );
}
