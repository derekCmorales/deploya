"use client";

import { useCallback, useEffect, useState } from "react";

import { ErrorApi } from "@/lib/api";
import { INTERVALO_SONDEO_MS } from "@/lib/proyectos";
import { debeSeguirTrasError } from "@/lib/reintento";

export interface Sondeo<T> {
  datos: T | null;
  error: ErrorApi | null;
  cargando: boolean;
  recargar: () => void;
}

/**
 * Lectura por polling (CQRS ligero): pide `leer` y repite cada 3 s mientras
 * `seguir(datos)` sea verdadero. `leer = null` no pide nada. Si una lectura falla por la red o el
 * servidor mientras seguía en marcha, reintenta en el siguiente ciclo en vez de dejar la pantalla congelada.
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
    let seguiaEnMarcha = false;
    const pedir = async () => {
      try {
        const nuevos = await leer();
        if (!vigente) return;
        setDatos(nuevos);
        setError(null);
        seguiaEnMarcha = seguir(nuevos);
        if (seguiaEnMarcha) temporizador = setTimeout(pedir, INTERVALO_SONDEO_MS);
      } catch (e) {
        if (!vigente) return;
        const falla = e instanceof ErrorApi ? e : new ErrorApi(0, "desconocido", "Algo salió mal.");
        setError(falla);
        if (debeSeguirTrasError(falla.estado, seguiaEnMarcha)) temporizador = setTimeout(pedir, INTERVALO_SONDEO_MS);
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
