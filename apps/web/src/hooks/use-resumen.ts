"use client";

import { useCallback, useMemo } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import { despliegueEnCurso } from "@/lib/proyectos";
import { seguirResumen, type ResumenProyecto } from "@/lib/resumen";

const esEnCurso = (estado: string) => despliegueEnCurso(estado as Parameters<typeof despliegueEnCurso>[0]);

/**
 * `GET /proyectos/:id/resumen` (13), cada 3 s mientras un despliegue siga en curso. `origen` mantiene
 * el sondeo después de reiniciar o detener hasta que el estado del activo cambie.
 */
export function useResumen(proyectoId: string, origen: string | null): Sondeo<ResumenProyecto> {
  const leer = useMemo(() => () => pedirApi<ResumenProyecto>(`/proyectos/${proyectoId}/resumen`), [proyectoId]);
  const seguir = useCallback((resumen: ResumenProyecto) => seguirResumen(resumen, origen, esEnCurso), [origen]);
  return useSondeo(leer, seguir);
}
