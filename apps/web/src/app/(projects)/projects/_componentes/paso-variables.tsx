import { Database, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Sunken } from "@/components/ui/card";
import type { useAltaProyecto } from "@/hooks/use-alta-proyecto";
import { DESCRIPCION_TIPO, variablesInyectadasPor } from "@/lib/datos";
import { MAXIMO_VARIABLES, clavesQueGanan, contarClaves } from "@/lib/variables";

import { PegarEnv } from "./pegar-env";
import { TablaVariables } from "./tabla-variables";

type Alta = ReturnType<typeof useAltaProyecto>;

/**
 * Paso 4 del asistente: la misma experiencia que la pestaña Variables (17) — tabla, «Pegar .env», mostrar y
 * ocultar, contador — sobre el borrador del alta. Lista lo que inyectan los recursos del paso Datos.
 */
export function PasoVariables({ alta }: { alta: Alta }) {
  const inyectadas = variablesInyectadasPor(alta.datos);
  const ganan = clavesQueGanan(alta.variables, inyectadas.flatMap((grupo) => grupo.claves));
  const total = contarClaves(alta.variables);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Paso 4 · Variables</p>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Variables de entorno</h2>
        <p className="text-muted-foreground">Se guardan cifradas y se pasan al contenedor al arrancar. Este paso es opcional.</p>
      </div>

      {alta.error?.tipo === "variables" ? <Banner variant="bad" title={alta.error.mensaje} /> : null}

      {inyectadas.length > 0 ? (
        <Sunken className="flex flex-col gap-2.5 px-4 py-3.5">
          <p className="flex items-center gap-2 text-xs font-medium">
            <Database className="size-3.5 text-muted-foreground" aria-hidden />
            Llegan solas de tus recursos de datos
          </p>
          {inyectadas.map((grupo) => (
            <div key={grupo.tipo} className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">{DESCRIPCION_TIPO[grupo.tipo].nombre}</p>
              <p className="font-mono text-xs leading-5 break-all">{grupo.claves.join(" · ")}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Si declaras una con la misma clave, gana la tuya.</p>
        </Sunken>
      ) : null}

      <TablaVariables
        filas={alta.variables}
        enmascarar
        onClave={(indice, valor) => alta.editarVariable(indice, { clave: valor })}
        onValor={(indice, valor) => alta.editarVariable(indice, { valor })}
        onMostrar={alta.alternarValor}
        onQuitar={alta.quitarVariable}
        insignia={(fila) => (ganan.has(fila.clave.trim()) ? <Badge variant="outline">gana la tuya</Badge> : null)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={alta.anadirVariable} disabled={alta.variables.length >= MAXIMO_VARIABLES}>
          <Plus />
          Añadir variable
        </Button>
        <PegarEnv filas={alta.variables} onPegar={alta.pegarVariables} />
        <span className="tnum text-xs text-muted-foreground">
          {total} / {MAXIMO_VARIABLES}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        No declares <span className="font-mono text-foreground">PORT</span>: lo tomamos del puerto interno ({alta.puerto || "8080"}).
      </p>
    </div>
  );
}
