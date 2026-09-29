"use client";

import { useCallback, useEffect, useState } from "react";

import { ErrorApi } from "@/lib/api";
import { INTERVALO_SONDEO_MS } from "@/lib/proyectos";

export interface Sondeo<T> {
  datos: T | null;
  error: ErrorApi | null;
  cargando: boolean;
  recargar: () => void;
}

/**
 * Lectura por polling (CQRS ligero): pide `leer` y repite cada 3 s mientras
 * `seguir(datos)` sea verdadero. `leer = null` no pide nada.
 */
export function useSondeo<T>(leer: (() => Promise<T>) | null, seguir: (datos: T) => boolean): Sondeo<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<ErrorApi | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const recargar = useCallback(() => setVuelta((v) => v + 1), []);

  useEffect(() => {
    if (!leer) return;
    let vigente = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const pedir = async () => {
      try {
        const nuevos = await leer();
        if (!vigente) return;
        setDatos(nuevos);
        setError(null);
        if (seguir(nuevos)) temporizador = setTimeout(pedir, INTERVALO_SONDEO_MS);
      } catch (e) {
        if (vigente) setError(e instanceof ErrorApi ? e : new ErrorApi(0, "desconocido", "Algo salió mal."));
      }
    };
    void pedir();
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [leer, seguir, vuelta]);

  return { datos, error, cargando: leer !== null && datos === null && error === null, recargar };
}
