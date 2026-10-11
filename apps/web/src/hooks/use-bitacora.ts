"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useSondeo } from "@/hooks/use-sondeo";
import { pedirApi } from "@/lib/api";
import { aplicarBloque, type LineaBitacora, type RespuestaBitacora } from "@/lib/despliegues";

const sigue = (respuesta: RespuestaBitacora) => !respuesta.terminado;

/**
 * Bitácora por polling: `GET /despliegues/:id/bitacora?desde=` cada 3 s.
 * Para cuando la API responde `terminado = true`.
 */
export function useBitacora(id: string | null) {
  const previas = useRef<LineaBitacora[]>([]);
  const desde = useRef(0);
  const [lineas, setLineas] = useState<LineaBitacora[]>([]);

  useEffect(() => {
    previas.current = [];
    desde.current = 0;
    setLineas([]);
  }, [id]);

  const leer = useMemo(() => (id ? () => leerBloque(id, previas, desde, setLineas) : null), [id]);
  const sondeo = useSondeo(leer, sigue);

  return {
    lineas,
    terminado: sondeo.datos?.terminado ?? false,
    error: sondeo.error,
    cargando: Boolean(id) && lineas.length === 0 && sondeo.cargando,
  };
}

async function leerBloque(
  id: string,
  previas: { current: LineaBitacora[] },
  desde: { current: number },
  publicar: (lineas: LineaBitacora[]) => void,
): Promise<RespuestaBitacora> {
  const data = await pedirApi<RespuestaBitacora>(`/despliegues/${id}/bitacora?desde=${desde.current}`);
  const paso = aplicarBloque(previas.current, desde.current, data);
  previas.current = paso.lineas;
  desde.current = paso.desde;
  publicar(paso.lineas);
  return data;
}
