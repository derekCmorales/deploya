"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useEliminarProyecto } from "@/hooks/use-eliminar-proyecto";
import { confirmacionCoincide, type ProyectoEnLista } from "@/lib/proyectos";

/** Zona de peligro + diálogo 19b: pide escribir el nombre antes de borrar el proyecto. */
export function EliminarProyecto({ proyecto, onEliminado }: { proyecto: ProyectoEnLista; onEliminado: () => void }) {
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-7 py-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Eliminar proyecto</h3>
        <p className="text-xs text-muted-foreground">Borra el proyecto y su historial. No se puede deshacer.</p>
      </div>
      <Button variant="destructive-outline" size="sm" onClick={() => setAbierto(true)}>
        <Trash2 />
        Eliminar proyecto
      </Button>
      <Dialog
        open={abierto}
        onOpenChange={cambiarApertura}
        title={`Eliminar ${proyecto.nombre}`}
        description="Esto borra de forma permanente el proyecto, sus variables y el historial de despliegues, y libera un lugar en tu plan."
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
        <Field id="confirmar-eliminar" label={`Escribe ${proyecto.nombre} para confirmar`} error={error}>
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
    </div>
  );
}
