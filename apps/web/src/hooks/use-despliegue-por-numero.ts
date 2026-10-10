"use client";

import { useMemo } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import type { VistaDespliegue } from "@/lib/proyectos";

const unaVez = () => false;

/** Resuelve `[n]` una vez. El sondeo posterior va por id (`useDespliegue`). */
export function useDesplieguePorNumero(proyectoId: string, numero: number): Sondeo<VistaDespliegue> {
  const leer = useMemo(() => {
    if (!Number.isInteger(numero) || numero < 1) return null;
    return () => pedirApi<VistaDespliegue>(`/proyectos/${proyectoId}/despliegues/${numero}`);
  }, [proyectoId, numero]);
  return useSondeo(leer, unaVez);
}
