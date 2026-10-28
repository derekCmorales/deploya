"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { ErrorApi, pedirApi } from "@/lib/api";
import {
  ESTADO_BITACORA_INICIAL,
  INTERVALO_BITACORA_MS,
  pausar,
  reanudar,
  recibirLineas,
  type EstadoBitacora,
  type RespuestaBitacora,
} from "@/lib/bitacoras";
import { iniciarSondeo } from "@/lib/sondeo";

type Accion = { tipo: "llegaron"; respuesta: RespuestaBitacora } | { tipo: "pausar" } | { tipo: "reanudar" } | { tipo: "limpiar" };

function reducir(estado: EstadoBitacora, accion: Accion): EstadoBitacora {
  switch (accion.tipo) {
    case "llegaron":
      return recibirLineas(estado, accion.respuesta.lineas);
    case "pausar":
      return pausar(estado);
    case "reanudar":
      return reanudar(estado);
    case "limpiar":
      return ESTADO_BITACORA_INICIAL;
  }
}

export interface BitacoraEjecucion {
  estado: EstadoBitacora;
  ultima: RespuestaBitacora | null;
  error: ErrorApi | null;
  leidoEn: string | null;
  pausar: () => void;
  reanudar: () => void;
  recargar: () => void;
}

/**
 * `GET /proyectos/:id/bitacora?desde=` cada 3 s (ADR 0006). La pausa no detiene el sondeo: lo
 * que llega se aparta y aparece al reanudar. Un fallo conserva lo leído y el sondeo sigue.
 */
export function useBitacoraEjecucion(proyectoId: string): BitacoraEjecucion {
  const [estado, despachar] = useReducer(reducir, ESTADO_BITACORA_INICIAL);
  const [ultima, setUltima] = useState<RespuestaBitacora | null>(null);
  const [error, setError] = useState<ErrorApi | null>(null);
  const [leidoEn, setLeidoEn] = useState<string | null>(null);
  const cursor = useRef<string | null>(null);
  const [vuelta, setVuelta] = useState(0);

  // Solo un cambio de proyecto invalida lo leído; «Reintentar» sigue desde la última línea.
  useEffect(() => {
    despachar({ tipo: "limpiar" });
    cursor.current = null;
  }, [proyectoId]);

  useEffect(() => {
    let vigente = true;

    const pedir = async (): Promise<void> => {
      const desde = cursor.current ? `?desde=${encodeURIComponent(cursor.current)}` : "";
      try {
        const respuesta = await pedirApi<RespuestaBitacora>(`/proyectos/${proyectoId}/bitacora${desde}`);
        if (!vigente) return;
        despachar({ tipo: "llegaron", respuesta });
        const ultimaNueva = respuesta.lineas.at(-1);
        if (ultimaNueva) cursor.current = ultimaNueva.en;
        setUltima(respuesta);
        setError(null);
        setLeidoEn(new Date().toISOString());
      } catch (e) {
        if (!vigente) return;
        setError(e instanceof ErrorApi ? e : new ErrorApi(0, "desconocido", "Algo salió mal."));
      }
    };

    const sondeo = iniciarSondeo(pedir, INTERVALO_BITACORA_MS);
    return () => {
      vigente = false;
      sondeo.detener();
    };
  }, [proyectoId, vuelta]);

  return {
    estado,
    ultima,
    error,
    leidoEn,
    pausar: useCallback(() => despachar({ tipo: "pausar" }), []),
    reanudar: useCallback(() => despachar({ tipo: "reanudar" }), []),
    recargar: useCallback(() => setVuelta((valor) => valor + 1), []),
  };
}
