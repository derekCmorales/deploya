/**
 * Lógica pura de la tarjeta 14c (Tiempo por etapa). Sin React, DOM ni red para
 * poder probarla con `node --test`.
 */

import type { EstadoDespliegue } from "./proyectos";

export const ULTIMOS_DESPLIEGUES = 14;
const MS_POR_SEGUNDO = 1000;
const SEGUNDOS_POR_MINUTO = 60;
export const MS_POR_MINUTO = SEGUNDOS_POR_MINUTO * MS_POR_SEGUNDO;

export const ETAPAS_TIEMPO = ["recepcion", "construccion", "ejecucion", "enrutamiento", "operacion"] as const;
export type EtapaTiempo = (typeof ETAPAS_TIEMPO)[number];

export const ETIQUETA_ETAPA: Record<EtapaTiempo, string> = {
  recepcion: "Recepción",
  construccion: "Construcción",
  ejecucion: "Ejecución",
  enrutamiento: "Enrutamiento",
  operacion: "Operación",
};

/** `GET /proyectos/:id/despliegues/tiempos?ultimos=14` (contrato `metricas.md § Tiempo por etapa`). */
export interface TiemposDespliegue {
  numero: number;
  creado: string;
  estado: EstadoDespliegue;
  reversion: boolean;
  etapas: Record<EtapaTiempo, number>;
  falloEn: EtapaTiempo | null;
}

export interface ResumenTiempos {
  medianaMs: number;
  porcentajeConstruccion: number;
  fallos: { fallidos: number; total: number };
  ultimaReversion: { numero: number; ms: number } | null;
}

export interface RespuestaTiempos {
  despliegues: TiemposDespliegue[];
  resumen: ResumenTiempos;
}

/** Los cuatro datos de la cabecera de 14c, ya en texto. */
export interface IndicadoresTiempos {
  mediana: string;
  construccion: string;
  fallos: string;
  reversion: string;
}

export interface SegmentoEtapa {
  etapa: EtapaTiempo;
  ms: number;
  fallo: boolean;
}

/** «38 s» · «2 min 44 s» · «0 s». */
export function formatoDuracion(ms: number): string {
  const total = Math.max(0, Math.round(ms / MS_POR_SEGUNDO));
  if (total < SEGUNDOS_POR_MINUTO) return `${total} s`;
  const minutos = Math.floor(total / SEGUNDOS_POR_MINUTO);
  return `${minutos} min ${total % SEGUNDOS_POR_MINUTO} s`;
}

/** Suma de las cinco etapas de un despliegue. */
export function duracionTotal(despliegue: Pick<TiemposDespliegue, "etapas">): number {
  return ETAPAS_TIEMPO.reduce((total, etapa) => total + despliegue.etapas[etapa], 0);
}

/** Los cinco tramos de la columna, en el orden del riel; un tramo omitido vale 0. */
export function segmentosDeEtapas(despliegue: TiemposDespliegue): SegmentoEtapa[] {
  return ETAPAS_TIEMPO.map((etapa) => ({
    etapa,
    ms: despliegue.etapas[etapa],
    fallo: despliegue.falloEn === etapa,
  }));
}

/**
 * Los tramos que se dibujan, de abajo arriba: los que duraron algo y el del fallo, aunque
 * haya durado 0. Una reversión no tiene Recepción ni Construcción; un Fallido termina en `falloEn`.
 */
export function tramosVisibles(despliegue: TiemposDespliegue): SegmentoEtapa[] {
  return segmentosDeEtapas(despliegue).filter((tramo) => tramo.ms > 0 || tramo.fallo);
}

/** Tope del eje Y en minutos enteros, con un mínimo de 1 min para que la escala no colapse. */
export function minutosDelEje(despliegues: TiemposDespliegue[]): number {
  const maximo = Math.max(0, ...despliegues.map(duracionTotal));
  return Math.max(1, Math.ceil(maximo / MS_POR_MINUTO));
}

/** «2 min 44 s» · «72 % del tiempo» · «2 de 14» · «38 s · sin construir». */
export function indicadoresTiempos(resumen: ResumenTiempos): IndicadoresTiempos {
  return {
    mediana: formatoDuracion(resumen.medianaMs),
    construccion: `${resumen.porcentajeConstruccion} % del tiempo`,
    fallos: `${resumen.fallos.fallidos} de ${resumen.fallos.total}`,
    reversion: resumen.ultimaReversion
      ? `${formatoDuracion(resumen.ultimaReversion.ms)} · sin construir`
      : "Sin reversiones",
  };
}

/** Ruta de `GET /proyectos/:id/despliegues/tiempos`; nunca pide más de los 14 de la ficha. */
export function consultaTiempos(proyectoId: string, ultimos: number = ULTIMOS_DESPLIEGUES): string {
  const pedidos = Number.isInteger(ultimos) && ultimos >= 1 ? Math.min(ultimos, ULTIMOS_DESPLIEGUES) : ULTIMOS_DESPLIEGUES;
  return `/proyectos/${proyectoId}/despliegues/tiempos?ultimos=${pedidos}`;
}

/** Texto del resumen accesible: cuántos despliegues, mediana (la de la API) y fallos. */
export function resumenAccesible(despliegues: TiemposDespliegue[], medianaMs: number): string {
  const total = despliegues.length;
  const fallidos = despliegues.filter((despliegue) => despliegue.estado === "fallido").length;
  const fallos = fallidos === 1 ? "1 fallido" : `${fallidos} fallidos`;
  return `${total} despliegues. Mediana ${formatoDuracion(medianaMs)}. ${fallos} de ${total}.`;
}

/** «Últimos 14 despliegues de api-tienda»: el número es el de despliegues que llegaron, no un fijo. */
export function subtituloTiempos(cantidad: number, nombre: string): string {
  return cantidad === 1 ? `Último despliegue de ${nombre}` : `Últimos ${cantidad} despliegues de ${nombre}`;
}

/** Para tablas y tooltips: un tramo en 0 se dice «omitida», no «0 s». */
export function textoTramo(ms: number): string {
  return ms > 0 ? formatoDuracion(ms) : "omitida";
}
