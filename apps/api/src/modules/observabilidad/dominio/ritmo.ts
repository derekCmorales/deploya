import type { PeriodoConsumo } from "./periodo";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Construcciones por día del período (I7): un elemento por día transcurrido, del 1 a
 * `hoy`, en UTC. Las fechas fuera del período no cuentan; `sum(diarios)` es el total
 * de `contarConstruccionesDesde` para el mismo `desde`.
 */
export function diariosDe(fechas: readonly Date[], periodo: PeriodoConsumo, hoy: Date): number[] {
  const conteo = new Array<number>(diasTranscurridos(periodo, hoy)).fill(0);
  for (const fecha of fechas) {
    if (fecha < periodo.desde || fecha >= periodo.reinicia) continue;
    const indice = fecha.getUTCDate() - 1;
    if (indice >= 0 && indice < conteo.length) conteo[indice] += 1;
  }
  return conteo;
}

function diasTranscurridos(periodo: PeriodoConsumo, hoy: Date): number {
  const delPeriodo = Math.round((periodo.reinicia.getTime() - periodo.desde.getTime()) / MS_POR_DIA);
  const desdeElInicio = Math.floor((hoy.getTime() - periodo.desde.getTime()) / MS_POR_DIA) + 1;
  return Math.max(0, Math.min(desdeElInicio, delPeriodo));
}
