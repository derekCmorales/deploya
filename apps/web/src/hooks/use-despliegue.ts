"use client";

import { useMemo } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import { despliegueEnCurso, type VistaDespliegue } from "@/lib/proyectos";

/** Sigue mientras está en curso. `origen` mantiene el sondeo hasta que el estado deje esa foto (reiniciar/detener). */
export function seguirDespliegue(vista: VistaDespliegue, origen: string | null): boolean {
  if (origen !== null && vista.estado === origen) return true;
  return despliegueEnCurso(vista.estado);
}

/** `GET /despliegues/:id` cada 3 s hasta que el despliegue termine. `null` no pide nada. */
export function useDespliegue(id: string | null, origen: string | null = null): Sondeo<VistaDespliegue> {
  const leer = useMemo(() => (id ? () => pedirApi<VistaDespliegue>(`/despliegues/${id}`) : null), [id]);
  const seguir = useMemo(() => (vista: VistaDespliegue) => seguirDespliegue(vista, origen), [origen]);
  return useSondeo(leer, seguir);
}
