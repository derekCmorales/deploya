"use client";

import { useState } from "react";

import { ErrorApi, pedirApi } from "@/lib/api";

/** `DELETE /proyectos/:id` (19b). Devuelve `true` si se eliminó; si no, deja el mensaje en `error`. */
export function useEliminarProyecto() {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eliminar = async (proyectoId: string, confirmacion: string): Promise<boolean> => {
    setOcupado(true);
    setError(null);
    try {
      await pedirApi(`/proyectos/${proyectoId}`, { metodo: "DELETE", cuerpo: { confirmacion } });
      return true;
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "Algo salió mal. Intenta de nuevo.");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  return { eliminar, ocupado, error, limpiarError: () => setError(null) };
}
