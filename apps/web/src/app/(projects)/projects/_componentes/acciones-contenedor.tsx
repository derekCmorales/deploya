"use client";

import { RotateCw, Square } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorApi, pedirApi } from "@/lib/api";
import { puedeDetener, puedeReiniciar } from "@/lib/despliegues";

/** «Reiniciar» y «Detener» (12b y 13): la API responde 202 y el estado llega por el sondeo. */
export function AccionesContenedor({ proyectoId, estado, alAccionar }: { proyectoId: string; estado: string; alAccionar: () => void }) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pedir = async (accion: "reiniciar" | "detener") => {
    setOcupado(true);
    setError(null);
    try {
      await pedirApi(`/proyectos/${proyectoId}/${accion}`, { metodo: "POST" });
      alAccionar();
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos completar la acción.");
    } finally {
      setOcupado(false);
    }
  };
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={ocupado || !puedeReiniciar(estado)} onClick={() => pedir("reiniciar")}>
          <RotateCw />
          Reiniciar
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={ocupado || !puedeDetener(estado)} onClick={() => pedir("detener")}>
          <Square />
          Detener
        </Button>
      </div>
      {error ? <p className="text-xs text-bad">{error}</p> : null}
    </div>
  );
}
