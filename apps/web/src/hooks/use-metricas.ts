"use client";

import { useCallback, useEffect, useState } from "react";

import { ErrorApi, pedirApi } from "@/lib/api";
import type { RangoMetricas, RespuestaMetricas } from "@/lib/metricas";

export const INTERVALO_METRICAS_MS = 60_000;

export interface MetricasProyecto {
  datos: RespuestaMetricas | null;
  error: ErrorApi | null;
  cargando: boolean;
  /** Reloj de la lectura: con él se dibuja la ventana y el punto «ahora». */
  leidoEn: string | null;
  recargar: () => void;
}

/**
 * `GET /proyectos/:id/metricas?rango=1h|24h` al montar, al cambiar el rango y cada 60 s.
 * Una muestra por minuto, como la gráfica de 16 y la tarjeta de 13c.
 */
export function useMetricas(proyectoId: string, rango: RangoMetricas): MetricasProyecto {
  const [datos, setDatos] = useState<RespuestaMetricas | null>(null);
  const [error, setError] = useState<ErrorApi | null>(null);
  const [leidoEn, setLeidoEn] = useState<string | null>(null);
  const [vuelta, setVuelta] = useState(0);
  const recargar = useCallback(() => setVuelta((valor) => valor + 1), []);

  useEffect(() => {
    let vigente = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    setDatos(null);
    setError(null);

    const pedir = async () => {
      try {
        const nuevas = await pedirApi<RespuestaMetricas>(`/proyectos/${proyectoId}/metricas?rango=${rango}`);
        if (!vigente) return;
        setDatos(nuevas);
        setError(null);
        setLeidoEn(new Date().toISOString());
        temporizador = setTimeout(pedir, INTERVALO_METRICAS_MS);
      } catch (e) {
        if (!vigente) return;
        setError(e instanceof ErrorApi ? e : new ErrorApi(0, "desconocido", "Algo salió mal."));
      }
    };

    void pedir();
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [proyectoId, rango, vuelta]);

  return { datos, error, cargando: datos === null && error === null, leidoEn, recargar };
}
