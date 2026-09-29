"use client";

import { useMemo } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import { despliegueEnCurso, type VistaDespliegue } from "@/lib/proyectos";

const enCurso = (vista: VistaDespliegue) => despliegueEnCurso(vista.estado);

/** `GET /despliegues/:id` cada 3 s hasta que el despliegue termine. `null` no pide nada. */
export function useDespliegue(id: string | null): Sondeo<VistaDespliegue> {
  const leer = useMemo(() => (id ? () => pedirApi<VistaDespliegue>(`/despliegues/${id}`) : null), [id]);
  return useSondeo(leer, enCurso);
}
