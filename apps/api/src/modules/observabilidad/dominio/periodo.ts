import { inicioDelMes } from "../../orquestacion/dominio/politica-despliegue";

export interface PeriodoConsumo {
  desde: Date;
  reinicia: Date;
}

/**
 * Período del mes calendario en UTC (invariante I7).
 * Reutiliza `inicioDelMes` del bloqueo para que ambos compartan exactamente el mismo corte.
 */
export function periodoDe(hoy: Date): PeriodoConsumo {
  return {
    desde: inicioDelMes(hoy),
    reinicia: new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1)),
  };
}
