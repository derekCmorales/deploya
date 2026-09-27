import { TransicionInvalida } from "./errores";
import type { EstadoDespliegue } from "./estados";

/**
 * Máquina de estados del despliegue (patrón State como tabla pura).
 * Única fuente de verdad: docs/diagramas/m1-m10/m4-m5-m6-estados-despliegue.mmd.
 */
const SIGUIENTES: Readonly<Record<EstadoDespliegue, readonly EstadoDespliegue[]>> = {
  encolado: ["construyendo", "cancelado"],
  construyendo: ["aprovisionando", "fallido", "cancelado"],
  revirtiendo: ["aprovisionando", "fallido", "cancelado"],
  aprovisionando: ["publicando", "fallido"],
  publicando: ["saludable", "fallido"],
  saludable: ["detenido"],
  detenido: ["aprovisionando"],
  fallido: [],
  cancelado: [],
};

export const ESTADOS_INICIALES: readonly EstadoDespliegue[] = ["encolado", "revirtiendo"];

export function puedeTransicionar(de: EstadoDespliegue, a: EstadoDespliegue): boolean {
  return SIGUIENTES[de].includes(a);
}

export function transicionar(de: EstadoDespliegue, a: EstadoDespliegue): EstadoDespliegue {
  if (!puedeTransicionar(de, a)) throw new TransicionInvalida(de, a);
  return a;
}
