"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado del despliegue activo que publica 13 con su sondeo y lee la cabecera del proyecto
 * para «Reiniciar» y «Detener» (Observer en memoria). `null` fuera de 13.
 */
let actual: string | null = null;
const oyentes = new Set<() => void>();

export function publicarEstadoActivo(estado: string | null): void {
  if (estado === actual) return;
  actual = estado;
  for (const oyente of oyentes) oyente();
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function useEstadoActivo(): string | null {
  return useSyncExternalStore(suscribir, () => actual, () => null);
}
