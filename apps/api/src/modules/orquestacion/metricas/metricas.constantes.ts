/** Un tick del trabajador: una muestra por contenedor Saludable. */
export const CADA_MS_MUESTREO = 60_000;

/** Lo anterior a esta ventana se borra en la corrida siguiente. */
export const RETENCION_MUESTRAS_MS = 24 * 60 * 60 * 1000;

export const VENTANA_1H_MS = 60 * 60 * 1000;
export const VENTANA_24H_MS = RETENCION_MUESTRAS_MS;

/** La serie de 24 h promedia en cubos de media hora (48 puntos si el cubo tiene muestras). */
export const INTERVALO_PROMEDIO_MS = 30 * 60 * 1000;
export const PUNTOS_SERIE_24H = 48;

export const MS_POR_MINUTO = 60_000;

/** `docker stats` expresa 100 % como 1 vCPU; el contrato guarda vCPU. */
export const PORCENTAJE_A_VCPU = 100;
export const DECIMALES_CPU = 3;

export const COLA_MUESTREO = "muestreo-metricas";
export const PROGRAMADOR_MUESTREO = "muestreo-cada-minuto";

export function programacionMuestreo(): { every: number } {
  return { every: CADA_MS_MUESTREO };
}
