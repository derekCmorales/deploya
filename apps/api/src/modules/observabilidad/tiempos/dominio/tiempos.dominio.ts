import { ETAPAS } from "../../../construccion/dominio/estados";
import type { TiemposDespliegue } from "../../../construccion/dominio/tiempos-despliegue";

/** Cuerpo de `resumen` en `GET /proyectos/:id/despliegues/tiempos`. */
export interface ResumenTiempos {
  /** Mediana de las duraciones totales de los Saludables sin reversión, en ms. */
  medianaMs: number;
  /** Parte del tiempo total que se fue en Construcción, en puntos porcentuales. */
  porcentajeConstruccion: number;
  fallos: { fallidos: number; total: number };
  /** Última reversión del período, con su duración total (sin construir). */
  ultimaReversion: { numero: number; ms: number } | null;
}

const PORCENTAJE = 100;

/** Suma de las cinco etapas; una etapa omitida o posterior al fallo vale 0. */
export function duracionTotal(despliegue: TiemposDespliegue): number {
  return ETAPAS.reduce((total, etapa) => total + despliegue.etapas[etapa], 0);
}

/** Mediana de las duraciones totales de los Saludables; las reversiones no construyen y no cuentan. */
export function medianaSaludables(tiempos: TiemposDespliegue[]): number {
  const totales = tiempos
    .filter((despliegue) => despliegue.estado === "saludable" && !despliegue.reversion)
    .map(duracionTotal)
    .sort((a, b) => a - b);
  if (totales.length === 0) return 0;
  const mitad = Math.floor(totales.length / 2);
  if (totales.length % 2 === 1) return totales[mitad];
  return Math.round((totales[mitad - 1] + totales[mitad]) / 2);
}

/** Porcentaje del tiempo total de todos los despliegues que se fue en Construcción. */
export function porcentajeConstruccion(tiempos: TiemposDespliegue[]): number {
  const total = tiempos.reduce((suma, despliegue) => suma + duracionTotal(despliegue), 0);
  if (total === 0) return 0;
  const construccion = tiempos.reduce((suma, despliegue) => suma + despliegue.etapas.construccion, 0);
  return Math.round((construccion / total) * PORCENTAJE);
}

/** Cuántos de los despliegues mostrados terminaron Fallidos. */
export function fallos(tiempos: TiemposDespliegue[]): { fallidos: number; total: number } {
  return {
    fallidos: tiempos.filter((despliegue) => despliegue.estado === "fallido").length,
    total: tiempos.length,
  };
}

/** La reversión más reciente y lo que tardó sin construir; `null` si no hubo. */
export function ultimaReversion(tiempos: TiemposDespliegue[]): { numero: number; ms: number } | null {
  const reversion = tiempos.filter((despliegue) => despliegue.reversion).sort((a, b) => b.numero - a.numero)[0];
  return reversion ? { numero: reversion.numero, ms: duracionTotal(reversion) } : null;
}

/** Todo lo que pinta la cabecera de la tarjeta 14c, a partir de los tiempos de los despliegues. */
export function resumenTiempos(tiempos: TiemposDespliegue[]): ResumenTiempos {
  return {
    medianaMs: medianaSaludables(tiempos),
    porcentajeConstruccion: porcentajeConstruccion(tiempos),
    fallos: fallos(tiempos),
    ultimaReversion: ultimaReversion(tiempos),
  };
}
