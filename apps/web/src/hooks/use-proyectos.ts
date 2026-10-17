"use client";

import { useCallback, useEffect } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import { EVENTO_PROYECTO_ACTUALIZADO } from "@/lib/configuracion";
import { algunoEnCurso, type ListaProyectos } from "@/lib/proyectos";

const leerProyectos = () => pedirApi<ListaProyectos>("/proyectos");
const nunca = () => false;

/**
 * `GET /proyectos` (10 / 10b). Con `sondear`, repite cada 3 s mientras algún último
 * despliegue siga en curso; el asistente de alta solo lo lee una vez.
 */
export function useProyectos({ sondear = true }: { sondear?: boolean } = {}): Sondeo<ListaProyectos> {
  const seguir = useCallback((lista: ListaProyectos) => sondear && algunoEnCurso(lista), [sondear]);
  const sondeo = useSondeo(leerProyectos, sondear ? seguir : nunca);
  const { recargar } = sondeo;
  useEffect(() => {
    window.addEventListener(EVENTO_PROYECTO_ACTUALIZADO, recargar);
    return () => window.removeEventListener(EVENTO_PROYECTO_ACTUALIZADO, recargar);
  }, [recargar]);
  return sondeo;
}
