"use client";

import { useCallback, useEffect, useState } from "react";

import {
  acumularSerie,
  INTERVALO_INFRAESTRUCTURA_MS,
  SERIE_NODO_VACIA,
  type SerieNodo,
  type VistaInfraestructura,
} from "@/lib/admin-infraestructura";
import { ErrorApi, pedirApi } from "@/lib/api";
import { iniciarSondeo } from "@/lib/sondeo";

export interface AdminInfraestructura {
  datos: VistaInfraestructura | null;
  serie: SerieNodo;
  error: ErrorApi | null;
  leidoEn: string | null;
  recargar: () => void;
}

/**
 * `GET /admin/infraestructura` (27) cada 5 s. Cada lectura suma un punto a la serie del nodo que
 * dibujan las gráficas compactas; un fallo conserva lo leído y el sondeo sigue.
 */
export function useAdminInfraestructura(): AdminInfraestructura {
  const [datos, setDatos] = useState<VistaInfraestructura | null>(null);
  const [serie, setSerie] = useState<SerieNodo>(SERIE_NODO_VACIA);
  const [error, setError] = useState<ErrorApi | null>(null);
  const [leidoEn, setLeidoEn] = useState<string | null>(null);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    let vigente = true;
    const pedir = async (): Promise<void> => {
      try {
        const vista = await pedirApi<VistaInfraestructura>("/admin/infraestructura");
        if (!vigente) return;
        setDatos(vista);
        setSerie((previa) => acumularSerie(previa, vista));
        setError(null);
        setLeidoEn(new Date().toISOString());
      } catch (e) {
        if (vigente) setError(e instanceof ErrorApi ? e : new ErrorApi(0, "desconocido", "Algo salió mal."));
      }
    };
    const sondeo = iniciarSondeo(pedir, INTERVALO_INFRAESTRUCTURA_MS);
    return () => {
      vigente = false;
      sondeo.detener();
    };
  }, [vuelta]);

  return { datos, serie, error, leidoEn, recargar: useCallback(() => setVuelta((v) => v + 1), []) };
}
