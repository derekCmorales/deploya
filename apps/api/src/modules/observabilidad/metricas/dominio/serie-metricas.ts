import type { EntradaVentana } from "../../../construccion/puertos/repositorio-despliegues.puerto";
import type { EstadoDespliegue } from "../../../construccion/dominio/estados";
import { redondearCpu } from "../../../orquestacion/metricas/dominio/cpu";
import {
  INTERVALO_PROMEDIO_MS,
  MS_POR_MINUTO,
  PUNTOS_SERIE_24H,
  VENTANA_1H_MS,
} from "../../../orquestacion/metricas/metricas.constantes";
import type { Muestra } from "../../../orquestacion/puertos/muestras-metricas.puerto";

export type RangoMetricas = "1h" | "24h";

export interface PuntoSerie {
  en: Date;
  cpu: number;
  memoriaMb: number;
}

export interface ChipDespliegue {
  en: Date;
  version: number;
}

export interface PromedioVersion {
  version: number;
  memoriaMb: number;
  cpu: number;
}

export interface RecursosLimite {
  cpus: number;
  memoriaMb: number;
}

export interface ValorPico {
  valor: number;
  en: Date;
}

/** Máximo de cada medida sobre las muestras crudas de la ventana; `null` si no hay muestras. */
export interface PicoMetricas {
  cpu: ValorPico | null;
  memoriaMb: ValorPico | null;
}

export const AVISO_CONTENEDOR_NO_CORRE = "El contenedor no está corriendo";

export interface RespuestaMetricas {
  limite: { cpu: number; memoriaMb: number };
  serie: PuntoSerie[];
  pico: PicoMetricas;
  aviso: string | null;
  despliegues: ChipDespliegue[];
  promedioPorVersion: PromedioVersion[];
}

export interface EntradaRespuesta {
  recursos: RecursosLimite;
  activo: { estado: EstadoDespliegue } | null;
  muestras: Muestra[];
  entradas: EntradaVentana[];
  rango: RangoMetricas;
  ahora: Date;
}

/**
 * 1 h: los últimos 60 min. 24 h: desde el inicio del primer cubo de 30 min, o sea los 48 cubos
 * alineados a :00/:30 UTC cuyo último contiene `ahora`.
 */
export function desdeDe(ahora: Date, rango: RangoMetricas): Date {
  if (rango === "1h") return new Date(ahora.getTime() - VENTANA_1H_MS);
  const ultimo = inicioDeBloque(ahora.getTime(), INTERVALO_PROMEDIO_MS);
  return new Date(ultimo - (PUNTOS_SERIE_24H - 1) * INTERVALO_PROMEDIO_MS);
}

/** Muestras crudas de la ventana del rango, de la más antigua a la más reciente. */
export function muestrasEnVentana(muestras: Muestra[], rango: RangoMetricas, ahora: Date): Muestra[] {
  const desde = desdeDe(ahora, rango);
  return muestras
    .filter((muestra) => muestra.tomada >= desde && muestra.tomada <= ahora)
    .sort((a, b) => a.tomada.getTime() - b.tomada.getTime());
}

/** 1 h: un punto por minuto con muestra. 24 h: promedio de cada cubo de 30 min (:00/:30 UTC) que tenga muestras. */
export function serieDe(muestras: Muestra[], rango: RangoMetricas, ahora: Date): PuntoSerie[] {
  return promediosPorBloque(muestrasEnVentana(muestras, rango, ahora), tamanoDeBloque(rango));
}

/** Pico de CPU y de memoria sobre muestras crudas; en un empate gana la más antigua. */
export function picoDe(muestras: Muestra[]): PicoMetricas {
  return {
    cpu: maximo(muestras, (muestra) => muestra.cpu),
    memoriaMb: maximo(muestras, (muestra) => muestra.memoriaMb),
  };
}

export function respuestaMetricas(entrada: EntradaRespuesta): RespuestaMetricas {
  const corre = entrada.activo?.estado === "saludable";
  const enVentana = corre ? muestrasEnVentana(entrada.muestras, entrada.rango, entrada.ahora) : [];
  return {
    limite: { cpu: entrada.recursos.cpus, memoriaMb: entrada.recursos.memoriaMb },
    serie: promediosPorBloque(enVentana, tamanoDeBloque(entrada.rango)),
    pico: picoDe(enVentana),
    aviso: corre ? null : AVISO_CONTENEDOR_NO_CORRE,
    despliegues: chipsDe(entrada.entradas, entrada.ahora),
    promedioPorVersion: promediosPorVersion(entrada.muestras),
  };
}

function maximo(muestras: Muestra[], medida: (muestra: Muestra) => number): ValorPico | null {
  let pico: ValorPico | null = null;
  for (const muestra of muestras) {
    if (pico && !superaAlPico(muestra, medida(muestra), pico)) continue;
    pico = { valor: medida(muestra), en: muestra.tomada };
  }
  return pico;
}

function superaAlPico(muestra: Muestra, valor: number, pico: ValorPico): boolean {
  return valor > pico.valor || (valor === pico.valor && muestra.tomada < pico.en);
}

function tamanoDeBloque(rango: RangoMetricas): number {
  return rango === "1h" ? MS_POR_MINUTO : INTERVALO_PROMEDIO_MS;
}

function promediosPorBloque(muestras: Muestra[], tamano: number): PuntoSerie[] {
  const grupos = new Map<number, Muestra[]>();
  for (const muestra of muestras) acumular(grupos, inicioDeBloque(muestra.tomada.getTime(), tamano), muestra);
  return [...grupos.entries()].sort(([a], [b]) => a - b).map(([inicio, grupo]) => promedio(grupo, new Date(inicio)));
}

function inicioDeBloque(instante: number, tamano: number): number {
  return Math.floor(instante / tamano) * tamano;
}

function chipsDe(entradas: EntradaVentana[], ahora: Date): ChipDespliegue[] {
  return entradas
    .filter((entrada) => entrada.creado <= ahora)
    .sort((a, b) => a.creado.getTime() - b.creado.getTime())
    .map((entrada) => ({ en: entrada.creado, version: entrada.numero }));
}

function promediosPorVersion(muestras: Muestra[]): PromedioVersion[] {
  const grupos = new Map<number, Muestra[]>();
  for (const muestra of muestras) acumular(grupos, muestra.version, muestra);
  return [...grupos.entries()].sort(([a], [b]) => a - b).map(([version, grupo]) => ({
    version,
    cpu: redondearCpu(media(grupo.map((muestra) => muestra.cpu))),
    memoriaMb: Math.round(media(grupo.map((muestra) => muestra.memoriaMb))),
  }));
}

function acumular<K>(grupos: Map<K, Muestra[]>, clave: K, muestra: Muestra): void {
  const grupo = grupos.get(clave) ?? [];
  grupo.push(muestra);
  grupos.set(clave, grupo);
}

function promedio(grupo: Muestra[], en: Date): PuntoSerie {
  return {
    en,
    cpu: redondearCpu(media(grupo.map((muestra) => muestra.cpu))),
    memoriaMb: Math.round(media(grupo.map((muestra) => muestra.memoriaMb))),
  };
}

function media(valores: number[]): number {
  return valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
}
