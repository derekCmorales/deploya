import { CuentaNoSuspendida } from "./errores";
import type { CuentaObjetivo } from "./suspension";
import { validarDetalle } from "./suspension";
import type { EstadoSuscripcionAdmin } from "./usuarios";

/** Valor nuevo de `AccionAdministrativa.accion` (datos-nucleo.md v2, SP-05). */
export const ACCION_REACTIVAR_CUENTA = "reactivar-cuenta";
/** `AccionAdministrativa.motivo` es obligatorio; reactivar no elige motivo de una lista. */
export const MOTIVO_REACTIVACION = "reactivacion";

/**
 * Suscripciones con los contenedores detenidos por el ciclo §4.4: reactivar la cuenta no salta
 * el ciclo, así que esperan a la renovación (la misma regla que `ReactivacionService` de M2).
 */
const SUSCRIPCION_CON_CONTENEDORES_DETENIDOS: readonly EstadoSuscripcionAdmin[] = ["suspendida", "cancelada"];

export interface SolicitudReactivacion {
  detalle: string | null;
}

/** Lo que se escribe en una sola transacción (Unit of Work). */
export interface Reactivacion {
  adminId: string;
  usuarioId: string;
  detalle: string | null;
  marca: Date;
}

/** Cuerpo de `POST /admin/usuarios/:id/reactivacion`: detalle opcional (≤ 500). */
export function validarSolicitudReactivacion(cuerpo: unknown): SolicitudReactivacion {
  const { detalle } = (cuerpo ?? {}) as Record<string, unknown>;
  return { detalle: validarDetalle(detalle) };
}

/** Solo se reactiva lo que está suspendido. */
export function exigirReactivable(cuenta: CuentaObjetivo): void {
  if (cuenta.estadoCuenta !== "suspendida") throw new CuentaNoSuspendida();
}

/** Con la suscripción vigente los contenedores arrancan al reactivar; si no, esperan a la renovación. */
export function reanudaContenedores(suscripcion: EstadoSuscripcionAdmin | null): boolean {
  return suscripcion === null || !SUSCRIPCION_CON_CONTENEDORES_DETENIDOS.includes(suscripcion);
}
