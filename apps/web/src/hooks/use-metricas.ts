"use client";

import { useCallback, useEffect, useReducer, useState } from "react";

import { ErrorApi, pedirApi } from "@/lib/api";
import {
  ESTADO_METRICAS_INICIAL,
  reducirMetricas,
  type RangoMetricas,
  type RespuestaMetricas,
} from "@/lib/metricas";
import { iniciarSondeo } from "@/lib/sondeo";

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
 * Un fallo no borra la última lectura: la pantalla la conserva y el sondeo sigue.
 */
export function useMetricas(proyectoId: string, rango: RangoMetricas): MetricasProyecto {
  const [estado, despachar] = useReducer(reducirMetricas, ESTADO_METRICAS_INICIAL);
  const [vuelta, setVuelta] = useState(0);
  const recargar = useCallback(() => setVuelta((valor) => valor + 1), []);

  // Solo un cambio de proyecto o de rango invalida la lectura anterior.
  useEffect(() => {
    despachar({ tipo: "limpiar" });
  }, [proyectoId, rango]);

  useEffect(() => {
    let vigente = true;
    despachar({ tipo: "reintento" });

    const pedir = async (): Promise<void> => {
      try {
        const nuevas = await pedirApi<RespuestaMetricas>(`/proyectos/${proyectoId}/metricas?rango=${rango}`);
        if (!vigente) return;
        despachar({ tipo: "exito", datos: nuevas, leidoEn: new Date().toISOString() });
      } catch (e) {
        if (!vigente) return;
        despachar({
          tipo: "fallo",
          error: e instanceof ErrorApi ? e : new ErrorApi(0, "desconocido", "Algo salió mal."),
        });
      }
    };

    const sondeo = iniciarSondeo(pedir, INTERVALO_METRICAS_MS);
    return () => {
      vigente = false;
      sondeo.detener();
    };
  }, [proyectoId, rango, vuelta]);

  return {
    ...estado,
    cargando: estado.datos === null && estado.error === null,
    recargar,
  };
}
