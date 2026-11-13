"use client";

import { useEffect } from "react";

import { avisarProyectoActualizado } from "@/lib/configuracion";

/**
 * Observer: cuando el detalle de un despliegue ve cambiar su estado, la cabecera del proyecto (que lee la
 * lista de proyectos) vuelve a leer al instante en lugar de esperar su próximo ciclo.
 */
export function useAvisoCambioDeEstado(estado: string | null | undefined): void {
  useEffect(() => {
    if (estado) avisarProyectoActualizado();
  }, [estado]);
}
