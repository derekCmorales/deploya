/**
 * Geometría pura de las gráficas: huecos, posición de eventos y navegación por
 * puntos. Sin React ni DOM para poder probarla con `node --test`.
 */

export interface MuestraSerie {
  tiempo: string;
  valor: number;
}

/** Evento de despliegue tal como lo devuelve `GET /proyectos/:id/metricas`. */
export interface EventoDespliegue {
  en: string;
  version: number;
}

export interface PuntoConIndice {
  indice: number;
  muestra: MuestraSerie;
}

export interface DetallePunto {
  valor: number;
  porcentaje: number;
  version: string | null;
}

const MS_POR_MINUTO = 60_000;
const MINUTOS_DE_HUECO_1H = 2;
const MINUTOS_DE_HUECO_24H = 60;
const PORCENTAJE = 100;

/** Un hueco mayor que este intervalo corta la línea. */
export function intervaloMaximo(rango: "1h" | "24h"): number {
  return (rango === "1h" ? MINUTOS_DE_HUECO_1H : MINUTOS_DE_HUECO_24H) * MS_POR_MINUTO;
}

/**
 * Segmentos de la serie. Un salto mayor que `maxIntervaloMs` (contenedor
 * reiniciado, sin muestras) corta la línea en vez de unir los extremos.
 * Cada punto conserva su índice original para no buscarlo después.
 */
export function puntosDeSerie(muestras: MuestraSerie[], maxIntervaloMs: number = intervaloMaximo("1h")): PuntoConIndice[][] {
  if (!muestras.length) return [];
  const segmentos: PuntoConIndice[][] = [];
  let segmentoActual: PuntoConIndice[] = [{ indice: 0, muestra: muestras[0] }];

  for (let i = 1; i < muestras.length; i++) {
    const tPrev = Date.parse(muestras[i - 1].tiempo);
    const tCurr = Date.parse(muestras[i].tiempo);
    if (Number.isFinite(tPrev) && Number.isFinite(tCurr) && tCurr - tPrev > maxIntervaloMs) {
      segmentos.push(segmentoActual);
      segmentoActual = [{ indice: i, muestra: muestras[i] }];
    } else {
      segmentoActual.push({ indice: i, muestra: muestras[i] });
    }
  }
  segmentos.push(segmentoActual);
  return segmentos;
}

/** Posición X de un despliegue dentro de la ventana, o `null` si cae fuera. */
export function eventoEnX(evento: EventoDespliegue, ventanaInicio: string, ventanaFin: string, ancho: number): number | null {
  const tEvento = Date.parse(evento.en);
  const tInicio = Date.parse(ventanaInicio);
  const tFin = Date.parse(ventanaFin);
  if (!Number.isFinite(tEvento) || !Number.isFinite(tInicio) || !Number.isFinite(tFin) || tFin <= tInicio) return null;
  if (tEvento < tInicio || tEvento > tFin) return null;
  return ((tEvento - tInicio) / (tFin - tInicio)) * ancho;
}

/** Punto más cercano a una fracción de la ventana (hover con zona ancha). */
export function indiceMasCercano(muestras: MuestraSerie[], fraccion: number, inicio: string, fin: string): number | null {
  if (!muestras.length) return null;
  const tInicio = Date.parse(inicio);
  const tFin = Date.parse(fin);
  if (!Number.isFinite(tInicio) || !Number.isFinite(tFin) || tFin <= tInicio) return null;
  const acotada = Number.isFinite(fraccion) ? Math.min(1, Math.max(0, fraccion)) : 0;
  const objetivo = tInicio + acotada * (tFin - tInicio);
  let mejor: number | null = null;
  let distancia = Number.POSITIVE_INFINITY;
  for (let i = 0; i < muestras.length; i++) {
    const tiempo = Date.parse(muestras[i].tiempo);
    if (!Number.isFinite(tiempo)) continue;
    const actual = Math.abs(tiempo - objetivo);
    if (actual < distancia) {
      distancia = actual;
      mejor = i;
    }
  }
  return mejor;
}

/** Flechas sobre la gráfica enfocada; `Escape` quita el punto activo. */
export function indiceAlMover(actual: number | null, tecla: string, total: number): number | null {
  if (total <= 0) return null;
  if (tecla === "Escape") return null;
  if (tecla === "ArrowRight") return actual === null || actual >= total - 1 ? 0 : actual + 1;
  if (tecla === "ArrowLeft") return actual === null || actual <= 0 ? total - 1 : actual - 1;
  return actual;
}

/** Versión vigente en un instante: el último despliegue que ya había ocurrido. */
export function versionEnPunto(despliegues: EventoDespliegue[], en: string): string | null {
  const tPunto = Date.parse(en);
  if (!Number.isFinite(tPunto)) return null;
  let vigente: EventoDespliegue | null = null;
  for (const despliegue of despliegues) {
    const tEvento = Date.parse(despliegue.en);
    if (!Number.isFinite(tEvento) || tEvento > tPunto) continue;
    if (!vigente || tEvento >= Date.parse(vigente.en)) vigente = despliegue;
  }
  return vigente ? `#${vigente.version}` : null;
}

/** Lo que pinta el tooltip de un punto: valor, % del límite y versión vigente. */
export function detallePunto(
  muestras: MuestraSerie[],
  indice: number,
  limite: number,
  despliegues: EventoDespliegue[],
): DetallePunto | null {
  const muestra = muestras[indice];
  if (!muestra) return null;
  return {
    valor: muestra.valor,
    porcentaje: limite > 0 ? Math.round((muestra.valor / limite) * PORCENTAJE) : 0,
    version: versionEnPunto(despliegues, muestra.tiempo),
  };
}
