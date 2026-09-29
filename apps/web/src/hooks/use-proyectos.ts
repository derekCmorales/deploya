"use client";

import { useCallback } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import { algunoEnCurso, type ListaProyectos } from "@/lib/proyectos";

const leerProyectos = () => pedirApi<ListaProyectos>("/proyectos");
const nunca = () => false;

/**
 * `GET /proyectos` (10 / 10b). Con `sondear`, repite cada 3 s mientras algún último
 * despliegue siga en curso; el asistente de alta solo lo lee una vez.
 */
export function useProyectos({ sondear = true }: { sondear?: boolean } = {}): Sondeo<ListaProyectos> {
  const seguir = useCallback((lista: ListaProyectos) => sondear && algunoEnCurso(lista), [sondear]);
  return useSondeo(leerProyectos, sondear ? seguir : nunca);
}
