import type { EntradaVentana } from "../../../construccion/puertos/repositorio-despliegues.puerto";
import type { EstadoDespliegue } from "../../../construccion/dominio/estados";
import { redondearCpu } from "../../../orquestacion/metricas/dominio/cpu";
import {
  INTERVALO_PROMEDIO_MS,
  MS_POR_MINUTO,
  PUNTOS_SERIE_24H,
  VENTANA_1H_MS,
  VENTANA_24H_MS,
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

export interface RespuestaMetricas {
  limite: { cpu: number; memoriaMb: number };
  serie: PuntoSerie[];
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

export function desdeDe(ahora: Date, rango: RangoMetricas): Date {
  const ventana = rango === "1h" ? VENTANA_1H_MS : VENTANA_24H_MS;
  return new Date(ahora.getTime() - ventana);
}

/** 1 h: un punto por minuto con muestra. 24 h: promedio de cada cubo de 30 min que tenga muestras. */
export function serieDe(muestras: Muestra[], rango: RangoMetricas, ahora: Date): PuntoSerie[] {
  const enVentana = muestras
    .filter((muestra) => muestra.tomada >= desdeDe(ahora, rango) && muestra.tomada <= ahora)
    .sort((a, b) => a.tomada.getTime() - b.tomada.getTime());
  return rango === "1h" ? porMinuto(enVentana) : promediosDeTreinta(enVentana, desdeDe(ahora, rango));
}

export function respuestaMetricas(entrada: EntradaRespuesta): RespuestaMetricas {
  const corre = entrada.activo?.estado === "saludable";
  return {
    limite: { cpu: entrada.recursos.cpus, memoriaMb: entrada.recursos.memoriaMb },
    serie: corre ? serieDe(entrada.muestras, entrada.rango, entrada.ahora) : [],
    despliegues: chipsDe(entrada.entradas, entrada.ahora),
    promedioPorVersion: promediosPorVersion(entrada.muestras),
  };
}

function porMinuto(muestras: Muestra[]): PuntoSerie[] {
  const grupos = new Map<number, Muestra[]>();
  for (const muestra of muestras) acumular(grupos, minutoDe(muestra.tomada), muestra);
  return [...grupos.entries()].sort(([a], [b]) => a - b).map(([minuto, grupo]) => promedio(grupo, new Date(minuto)));
}

function promediosDeTreinta(muestras: Muestra[], desde: Date): PuntoSerie[] {
  const puntos: PuntoSerie[] = [];
  for (let indice = 0; indice < PUNTOS_SERIE_24H; indice += 1) {
    const inicio = new Date(desde.getTime() + indice * INTERVALO_PROMEDIO_MS);
    const grupo = muestras.filter((muestra) => caeEnCubo(muestra.tomada, inicio, indice === PUNTOS_SERIE_24H - 1));
    if (grupo.length > 0) puntos.push(promedio(grupo, inicio));
  }
  return puntos;
}

function caeEnCubo(tomada: Date, inicio: Date, ultimo: boolean): boolean {
  const fin = inicio.getTime() + INTERVALO_PROMEDIO_MS;
  if (tomada.getTime() < inicio.getTime()) return false;
  return ultimo ? tomada.getTime() <= fin : tomada.getTime() < fin;
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

function minutoDe(tomada: Date): number {
  return Math.floor(tomada.getTime() / MS_POR_MINUTO) * MS_POR_MINUTO;
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
