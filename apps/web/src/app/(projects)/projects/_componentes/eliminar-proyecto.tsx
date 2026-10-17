"use client";

import { Clock, Lock, Package, Trash2, TriangleAlert } from "lucide-react";
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
    <section id="zona-de-peligro" className="mt-4 flex flex-col overflow-hidden rounded-xl border border-destructive/40">
      <div className="flex items-center gap-2 border-b border-destructive/25 px-4 py-3">
        <TriangleAlert className="size-4 text-destructive" aria-hidden />
        <h2 className="text-sm font-semibold">Zona de peligro</h2>
      </div>
      <div className="flex flex-wrap items-center gap-4 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm font-medium">Eliminar proyecto</p>
          <p className="text-xs text-muted-foreground">Detiene y borra el contenedor, sus imágenes, variables e historial. No se puede deshacer.</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setAbierto(true)}>
          <Trash2 />
          Eliminar proyecto
        </Button>
      </div>
      <Dialog
        open={abierto}
        onOpenChange={cambiarApertura}
        title={
          <span className="flex items-center gap-2">
            <Trash2 className="size-[18px] text-destructive" aria-hidden />
            Eliminar {proyecto.nombre}
          </span>
        }
        description={
          <>
            Esto detiene el servicio en <span className="font-mono">{url.replace(/^https?:\/\//, "")}</span> y borra de forma permanente:
          </>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => cambiarApertura(false)} disabled={ocupado}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmar} disabled={ocupado || !confirmacionCoincide(proyecto.nombre, escrito)}>
              <Trash2 />
              Eliminar proyecto
            </Button>
          </>
        }
      >
        <ul className="flex flex-col gap-1.5 text-sm [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
          <li className="flex items-center gap-2">
            <Package aria-hidden />
            El contenedor y sus imágenes
          </li>
          {conteos ? (
            <li className="flex items-center gap-2">
              <Lock aria-hidden />
              {textoVariables(conteos.variables)}
            </li>
          ) : null}
          {conteos ? (
            <li className="flex items-center gap-2">
              <Clock aria-hidden />
              {textoHistorial(conteos.despliegues)}
            </li>
          ) : null}
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
            className="font-mono"
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
