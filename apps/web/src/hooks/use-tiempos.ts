"use client";

import { useMemo } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import { consultaTiempos, type RespuestaTiempos } from "@/lib/tiempos";

/** Los tiempos no se sondean: cambian al terminar un despliegue, no cada 3 s. */
const NO_SEGUIR = () => false;

/** `GET /proyectos/:id/despliegues/tiempos?ultimos=14` (SP-14). */
export function useTiempos(proyectoId: string): Sondeo<RespuestaTiempos> {
  const leer = useMemo(() => () => pedirApi<RespuestaTiempos>(consultaTiempos(proyectoId)), [proyectoId]);
  return useSondeo(leer, NO_SEGUIR);
}
