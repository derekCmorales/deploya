import type { Artefacto } from "../../construccion/dominio/despliegue";

/** Cuántos artefactos recientes se conservan en el nodo, además del activo (ADR 0004). */
export const ARTEFACTOS_RETENIDOS = 5;

/**
 * Qué artefactos pierden su imagen: todos los disponibles salvo los `retenidos` más recientes
 * y el que atiende el tráfico, que nunca se retira. Función pura (se prueba con listas literales).
 */
export function aRetirar(
  disponibles: readonly Artefacto[],
  artefactoActivoId: string | null,
  retenidos: number = ARTEFACTOS_RETENIDOS,
): Artefacto[] {
  const recientes = [...disponibles].sort((a, b) => b.numero - a.numero).slice(0, retenidos);
  const conservados = new Set(recientes.map((a) => a.id));
  if (artefactoActivoId) conservados.add(artefactoActivoId);
  return disponibles.filter((a) => !conservados.has(a.id)).sort((a, b) => a.numero - b.numero);
}

export const PoliticaRetencion = { aRetirar } as const;
