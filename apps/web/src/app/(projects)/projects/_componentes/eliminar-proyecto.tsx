"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useEliminarProyecto } from "@/hooks/use-eliminar-proyecto";
import { textoHistorial, textoVariables } from "@/lib/configuracion";
import { confirmacionCoincide } from "@/lib/proyectos";

/** Lo que se borra con el proyecto, con los conteos reales que el servidor ya tiene. */
export interface ConteosProyecto {
  variables: number;
  despliegues: number;
}

/** «Zona de peligro» de la pantalla 19 + diálogo 19b: pide escribir el nombre antes de borrar el proyecto. */
export function EliminarProyecto({
  proyecto,
  url,
  conteos,
  onEliminado,
}: {
  proyecto: { id: string; nombre: string };
  url: string;
  conteos: ConteosProyecto | null;
  onEliminado: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [escrito, setEscrito] = useState("");
  const { eliminar, ocupado, error, limpiarError } = useEliminarProyecto();

  const cambiarApertura = (valor: boolean) => {
    setAbierto(valor);
    setEscrito("");
    limpiarError();
  };

  const confirmar = async () => {
    if (await eliminar(proyecto.id, escrito.trim())) {
      cambiarApertura(false);
      onEliminado();
    }
  };

  return (
    <section id="zona-de-peligro" className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">Zona de peligro</h3>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bad/40 px-5 py-4">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-semibold">Eliminar proyecto</h4>
          <p className="text-xs text-muted-foreground">Detiene y borra el contenedor, sus imágenes, variables e historial. No se puede deshacer.</p>
        </div>
        <Button variant="destructive-outline" size="sm" onClick={() => setAbierto(true)}>
          <Trash2 />
          Eliminar proyecto
        </Button>
      </div>
      <Dialog
        open={abierto}
        onOpenChange={cambiarApertura}
        title={`Eliminar ${proyecto.nombre}`}
        description={
          <>
            Esto detiene el servicio en <span className="font-mono">{url}</span> y borra de forma permanente:
          </>
        }
        footer={
          <>
            <Button variant="outline" onClick={() => cambiarApertura(false)} disabled={ocupado}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmar} disabled={ocupado || !confirmacionCoincide(proyecto.nombre, escrito)}>
              Eliminar
            </Button>
          </>
        }
      >
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>El contenedor y sus imágenes</li>
          {conteos ? <li>{textoVariables(conteos.variables)}</li> : null}
          {conteos ? <li>{textoHistorial(conteos.despliegues)}</li> : null}
        </ul>
        <Field
          id="confirmar-eliminar"
          label={
            <>
              Escribe <span className="font-mono">{proyecto.nombre}</span> para confirmar
            </>
          }
          error={error}
        >
          <Input
            id="confirmar-eliminar"
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            autoComplete="off"
            aria-invalid={!!error}
            aria-describedby={error ? "confirmar-eliminar-msg" : undefined}
          />
        </Field>
      </Dialog>
    </section>
  );
}
