"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMiSuscripcion } from "@/hooks/use-suscripcion";
import { useVariablesProyecto } from "@/hooks/use-variables-proyecto";
import { bloqueoDespliegue, haceCuanto } from "@/lib/proyectos";
import { avisoEstado, sinVigencia } from "@/lib/suscripcion";
import { MAXIMO_VARIABLES, contarClaves, textoCambios, type FilaVariable } from "@/lib/variables";

import { BannerBloqueo } from "./banner-bloqueo";
import { PegarEnv } from "./pegar-env";
import { TablaVariables } from "./tabla-variables";

/** Pantalla 17. Los cambios no tocan el contenedor hasta el próximo despliegue. */
export function PanelVariables({ proyectoId }: { proyectoId: string }) {
  const variables = useVariablesProyecto(proyectoId);
  const suscripcion = useMiSuscripcion();
  const bloqueada = suscripcion.datos ? sinVigencia(suscripcion.datos.estado) : false;
  const aviso = suscripcion.datos ? avisoEstado(suscripcion.datos.estado) : null;
  const [ahora] = useState(() => new Date());
  if (variables.cargando) return <Skeleton className="mx-8 mt-6 h-40" />;

  return (
    <div className="flex flex-col gap-5 px-4 sm:px-8 py-6">
      {bloqueada && aviso ? <BannerBloqueo codigo="suscripcion-no-permite" mensaje={aviso.texto} /> : null}
      <CambiosPendientes variables={variables} desplegarBloqueado={bloqueada} />
      {variables.codigo && variables.error && bloqueoDespliegue(variables.codigo, variables.error) ? (
        <BannerBloqueo codigo={variables.codigo} mensaje={variables.error} />
      ) : null}
      {variables.error && !bloqueoDespliegue(variables.codigo ?? "", variables.error) ? <Banner variant="bad" title={variables.error} /> : null}
      <TablaVariables
        filas={variables.filas}
        onClave={(indice, valor) => variables.editar(indice, { clave: valor })}
        onValor={(indice, valor) => variables.editar(indice, { valor })}
        onMostrar={variables.mostrar}
        onQuitar={variables.quitar}
        insignia={(fila) => (fila.nueva ? <span className="text-xs text-muted-foreground">Nueva</span> : null)}
        extra={{ titulo: "Actualizada", celda: (fila) => marca(fila, variables.guardadas, ahora) }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={variables.anadir} disabled={variables.filas.length >= MAXIMO_VARIABLES}>
          <Plus />
          Añadir variable
        </Button>
        <PegarEnv filas={variables.filas} onPegar={variables.pegar} />
        <span className="tnum text-xs text-muted-foreground">
          {contarClaves(variables.filas)} / {MAXIMO_VARIABLES}
        </span>
      </div>
    </div>
  );
}

type Borrador = ReturnType<typeof useVariablesProyecto>;

function CambiosPendientes({ variables, desplegarBloqueado }: { variables: Borrador; desplegarBloqueado: boolean }) {
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
          <Button type="button" size="sm" onClick={variables.guardarYDesplegar} disabled={variables.ocupado || desplegarBloqueado}>
            Guardar y desplegar
          </Button>
        </>
      }
    >
      Se aplican en el próximo despliegue. El contenedor actual sigue con las anteriores.
    </Banner>
  );
}

function marca(fila: FilaVariable, guardadas: { clave: string; actualizado: string }[], ahora: Date): string {
  if (fila.nueva) return "ahora";
  const fecha = guardadas.find((guardada) => guardada.clave === fila.clave)?.actualizado;
  return fecha ? haceCuanto(fecha, ahora) : "ahora";
}
