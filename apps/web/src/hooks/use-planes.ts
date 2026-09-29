"use client";

import { useCallback, useEffect, useState } from "react";

import { obtenerPlanes, type PlanCatalogo } from "@/lib/planes";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type EstadoCatalogo = { tipo: "cargando" } | { tipo: "listo"; planes: PlanCatalogo[] } | { tipo: "error" };

/** Lee el catálogo de la API (la base), nunca de constantes de la web. */
export function usePlanes(): { estado: EstadoCatalogo; reintentar: () => void } {
  const [estado, setEstado] = useState<EstadoCatalogo>({ tipo: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: "cargando" });
    obtenerPlanes(API_URL)
      .then((planes) => vigente && setEstado({ tipo: "listo", planes }))
      .catch(() => vigente && setEstado({ tipo: "error" }));
    return () => {
      vigente = false;
    };
  }, [intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  return { estado, reintentar };
}
