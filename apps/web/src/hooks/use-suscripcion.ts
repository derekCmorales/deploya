"use client";

import { useCallback, useMemo, useState } from "react";

import { useSondeo, type Sondeo } from "@/hooks/use-sondeo";
import { ErrorApi, pedirApi } from "@/lib/api";
import type { Vigencia } from "@/lib/planes";
import { ultimos4, type Cotizacion, type FormularioTarjeta, type MiSuscripcion, type ResultadoContratacion } from "@/lib/suscripcion";

const leerMia = () => pedirApi<MiSuscripcion>("/suscripciones/mia");
const nunca = () => false;

/** `GET /suscripciones/mia` (08 y «Plan actual» de 06). `activo = false` no pide nada (visitante). */
export function useMiSuscripcion({ activo = true }: { activo?: boolean } = {}): Sondeo<MiSuscripcion> {
  return useSondeo(activo ? leerMia : null, nunca);
}

/** `GET /suscripciones/cotizacion` para el resumen de 07. */
export function useCotizacion(plan: string | null, vigencia: Vigencia): Sondeo<Cotizacion> {
  const leer = useMemo(
    () =>
      plan
        ? () => pedirApi<Cotizacion>(`/suscripciones/cotizacion?plan=${encodeURIComponent(plan)}&vigenciaDias=${vigencia}`)
        : null,
    [plan, vigencia],
  );
  return useSondeo(leer, nunca);
}

export type FaseContratacion =
  | { fase: "formulario" }
  | { fase: "procesando"; ultimos4: string }
  | { fase: "resultado"; resultado: ResultadoContratacion }
  | { fase: "error"; error: ErrorApi };

/** Estado de 07 → 07b: el POST dura lo que tarde la pasarela (hasta 5 s con la tarjeta lenta). */
export function useContratacion() {
  const [estado, setEstado] = useState<FaseContratacion>({ fase: "formulario" });

  const contratar = useCallback(async (plan: string, vigencia: Vigencia, tarjeta: FormularioTarjeta) => {
    setEstado({ fase: "procesando", ultimos4: ultimos4(tarjeta.numero) });
    try {
      const resultado = await pedirApi<ResultadoContratacion>("/suscripciones/contratar", {
        metodo: "POST",
        cuerpo: { plan, vigenciaDias: Number(vigencia), tarjeta },
      });
      setEstado({ fase: "resultado", resultado });
    } catch (e) {
      setEstado({ fase: "error", error: e instanceof ErrorApi ? e : new ErrorApi(0, "desconocido", "Algo salió mal.") });
    }
  }, []);

  const volver = useCallback(() => setEstado({ fase: "formulario" }), []);
  return { estado, contratar, volver };
}

/** `POST /suscripciones/descenso` desde el panel «Cambiar plan» de 08. */
export function useDescenso(alTerminar: () => void) {
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const [error, setError] = useState<ErrorApi | null>(null);

  const programar = useCallback(
    async (plan: string) => {
      setEnCurso(plan);
      setError(null);
      try {
        await pedirApi<MiSuscripcion>("/suscripciones/descenso", { metodo: "POST", cuerpo: { plan } });
        alTerminar();
      } catch (e) {
        setError(e instanceof ErrorApi ? e : new ErrorApi(0, "desconocido", "Algo salió mal."));
      } finally {
        setEnCurso(null);
      }
    },
    [alTerminar],
  );

  return { enCurso, error, programar };
}
