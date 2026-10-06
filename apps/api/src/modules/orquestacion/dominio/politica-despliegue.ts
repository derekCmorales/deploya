import { CuotaConstruccionesAgotada, SuscripcionNoPermite } from "./errores";

/** Estados de la suscripción (§4.4, M2) tal como los entrega `cuotaDe`. No son estados de despliegue. */
export type EstadoSuscripcion = "activa" | "por-vencer" | "vencida" | "suspendida" | "cancelada";

const ESTADOS_QUE_PERMITEN: readonly EstadoSuscripcion[] = ["activa", "por-vencer"];

export interface SituacionDespliegue {
  estado: EstadoSuscripcion;
  construccionesUsadas: number;
  construccionesMes: number;
}

/**
 * PoliticaDespliegue (Specification pura): primero el estado de la suscripción y luego la
 * cuota de construcciones del mes. Lanza `SuscripcionNoPermite` o `CuotaConstruccionesAgotada`.
 */
export function verificarDespliegue(situacion: SituacionDespliegue): void {
  if (!ESTADOS_QUE_PERMITEN.includes(situacion.estado)) throw new SuscripcionNoPermite(situacion.estado);
  if (situacion.construccionesUsadas >= situacion.construccionesMes) {
    throw new CuotaConstruccionesAgotada(situacion.construccionesMes);
  }
}

/** Día 1 del mes calendario en UTC a las 00:00 (invariante I7 de datos-nucleo.md). */
export function inicioDelMes(ahora: Date): Date {
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1));
}
