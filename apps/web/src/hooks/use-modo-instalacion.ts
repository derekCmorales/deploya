"use client";

import { useSondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import { MODO_POR_DEFECTO, RUTA_MODO_INSTALACION, type EstadoModo } from "@/lib/instalacion";

const nunca = () => false;
const leerModo = () => pedirApi<EstadoModo>(RUTA_MODO_INSTALACION);

/** `GET /instalacion/modo` una vez; mientras carga (o si falla), la nube. */
export function useModoInstalacion(): EstadoModo & { cargando: boolean } {
  const { datos, cargando } = useSondeo(leerModo, nunca);
  return { ...(datos ?? MODO_POR_DEFECTO), cargando: cargando && !datos };
}
