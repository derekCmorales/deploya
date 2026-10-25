/**
 * Geometría pura de las gráficas: huecos, posición de eventos y navegación por
 * puntos. Sin React ni DOM para poder probarla con `node --test`.
 */

import type { ChipDespliegue, PuntoGrafica } from "@/lib/metricas";

export interface PuntoConIndice {
  indice: number;
  muestra: PuntoGrafica;
}

const MS_POR_MINUTO = 60_000;
const INTERVALO_1H_MS = MS_POR_MINUTO;
const INTERVALO_24H_MS = 30 * MS_POR_MINUTO;
const FACTOR_DE_HUECO = 1.5;

/**
 * Un hueco mayor que 1,5 veces el intervalo esperado corta la línea.
 * Así un solo cubo de 30 min (24 h) o un minuto (1 h) ausente no se une por encima.
 */
export function intervaloMaximo(rango: "1h" | "24h"): number {
  return (rango === "1h" ? INTERVALO_1H_MS : INTERVALO_24H_MS) * FACTOR_DE_HUECO;
}

/**
 * Segmentos de la serie. Un salto mayor que `maxIntervaloMs` (contenedor
 * reiniciado, sin muestras) corta la línea en vez de unir los extremos.
 * Cada punto conserva su índice original para no buscarlo después.
 */
export function puntosDeSerie(muestras: PuntoGrafica[], maxIntervaloMs: number = intervaloMaximo("1h")): PuntoConIndice[][] {
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
export function eventoEnX(evento: ChipDespliegue, ventanaInicio: string, ventanaFin: string, ancho: number): number | null {
  const tEvento = Date.parse(evento.en);
  const tInicio = Date.parse(ventanaInicio);
  const tFin = Date.parse(ventanaFin);
  if (!Number.isFinite(tEvento) || !Number.isFinite(tInicio) || !Number.isFinite(tFin) || tFin <= tInicio) return null;
  if (tEvento < tInicio || tEvento > tFin) return null;
  return ((tEvento - tInicio) / (tFin - tInicio)) * ancho;
}

/** Punto más cercano a una fracción de la ventana (hover con zona ancha). */
export function indiceMasCercano(muestras: PuntoGrafica[], fraccion: number, inicio: string, fin: string): number | null {
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

/**
 * Teclado sobre la gráfica enfocada: las flechas se detienen en los extremos,
 * `Home`/`End` saltan al primero/último y `Escape` quita el punto activo.
 */
export function indiceAlMover(actual: number | null, tecla: string, total: number): number | null {
  if (total <= 0) return null;
  if (tecla === "Escape") return null;
  if (tecla === "Home") return 0;
  if (tecla === "End") return total - 1;
  if (tecla === "ArrowRight") return actual === null ? 0 : Math.min(total - 1, actual + 1);
  if (tecla === "ArrowLeft") return actual === null ? total - 1 : Math.max(0, actual - 1);
  return actual;
}
