import { SoloSeReintentaUnFallido, YaNoSePuedeCancelar } from "./errores";
import type { EstadoDespliegue } from "./estados";

export type AccionDespliegue = "cancelar" | "reintentar";

/** Estados del despliegue desde los que se permite cada acción (tabla: una acción nueva es una fila). */
const ESTADOS_PERMITIDOS: Readonly<Record<AccionDespliegue, readonly EstadoDespliegue[]>> = {
  cancelar: ["encolado", "construyendo", "revirtiendo"],
  reintentar: ["fallido"],
};

export function accionPermitida(accion: AccionDespliegue, estado: EstadoDespliegue): boolean {
  return ESTADOS_PERMITIDOS[accion].includes(estado);
}

export function exigirCancelable(estado: EstadoDespliegue): void {
  if (!accionPermitida("cancelar", estado)) throw new YaNoSePuedeCancelar(estado);
}

export function exigirReintentable(estado: EstadoDespliegue): void {
  if (!accionPermitida("reintentar", estado)) throw new SoloSeReintentaUnFallido(estado);
}

export const PoliticaAcciones = { permitida: accionPermitida, exigirCancelable, exigirReintentable } as const;
