/**
 * Pantalla 27 · Admin · Infraestructura (SP-13). Solo lectura: funciones puras de texto y la
 * serie del nodo, que la web arma con sus propias lecturas (la API no guarda historia del nodo).
 */

import type { EstadoDespliegue } from "./proyectos";

export interface Uso {
  usado: number;
  total: number;
}

/** `GET /admin/infraestructura` (contrato `docs/contratos/metricas.md § Infraestructura`). */
export interface VistaInfraestructura {
  tomado: string;
  nodo: { cpu: Uso; memoriaMb: Uso; discoGb: Uso };
  cola: {
    enEspera: number;
    enCurso: number;
    fallidas24h: number;
    trabajos: { proyecto: string; numero: number; estado: EstadoDespliegue; ms: number }[];
  };
  entornos: { proyecto: string; titular: string; estado: EstadoDespliegue; cpu: number | null; memoriaMb: number | null }[];
  totalProyectos: number;
}

export type RecursoNodo = "cpu" | "memoria" | "disco";
export type SerieNodo = Record<RecursoNodo, { tiempo: string; valor: number }[]>;

export const RUTA_ADMIN_INFRAESTRUCTURA = "/admin/infraestructura";
/** «actualizado hace 5 s». */
export const INTERVALO_INFRAESTRUCTURA_MS = 5000;
/** Cinco minutos de lecturas cada 5 s en la gráfica compacta. */
export const PUNTOS_SERIE_NODO = 60;
export const SERIE_NODO_VACIA: SerieNodo = { cpu: [], memoria: [], disco: [] };

const MB_POR_GB = 1024;
const MS_POR_SEGUNDO = 1000;
const SEGUNDOS_POR_MINUTO = 60;
const CIEN = 100;
const DECIMALES_CPU = 2;
const SIN_DATO = "—";

const ESTADOS_EN_CURSO: readonly EstadoDespliegue[] = ["construyendo", "aprovisionando", "publicando", "revirtiendo"];

const decimal = (valor: number) => String(Math.round(valor * 10) / 10);

/** «430 MB», «1.6 GB», «4 GB». */
export function textoMemoriaNodo(mb: number): string {
  return mb >= MB_POR_GB ? `${decimal(mb / MB_POR_GB)} GB` : `${Math.round(mb)} MB`;
}

export function porcentajeDe({ usado, total }: Uso): number {
  return total > 0 ? Math.round((usado / total) * CIEN) : 0;
}

export interface TarjetaNodo {
  recurso: RecursoNodo;
  titulo: string;
  porcentaje: number;
  cifra: string;
  de: string;
  limite: number;
  unidad: string;
}

/** Las tres tarjetas del nodo: CPU, memoria y disco con su total. */
export function tarjetasNodo(nodo: VistaInfraestructura["nodo"]): TarjetaNodo[] {
  return [
    {
      recurso: "cpu",
      titulo: "CPU del nodo",
      porcentaje: porcentajeDe(nodo.cpu),
      cifra: `${nodo.cpu.usado.toFixed(DECIMALES_CPU)} vCPU`,
      de: `de ${nodo.cpu.total} vCPU`,
      limite: nodo.cpu.total,
      unidad: "vCPU",
    },
    {
      recurso: "memoria",
      titulo: "Memoria",
      porcentaje: porcentajeDe(nodo.memoriaMb),
      cifra: textoMemoriaNodo(nodo.memoriaMb.usado),
      de: `de ${textoMemoriaNodo(nodo.memoriaMb.total)}`,
      limite: nodo.memoriaMb.total,
      unidad: "MB",
    },
    {
      recurso: "disco",
      titulo: "Disco",
      porcentaje: porcentajeDe(nodo.discoGb),
      cifra: `${decimal(nodo.discoGb.usado)} GB`,
      de: `de ${decimal(nodo.discoGb.total)} GB · imágenes y artefactos`,
      limite: nodo.discoGb.total,
      unidad: "GB",
    },
  ];
}

/** «VPS · 2 vCPU · 4 GB · actualizado hace 5 s». */
export function textoNodo(nodo: VistaInfraestructura["nodo"], leidoEn: string, ahora: Date): string {
  const segundos = Math.max(0, Math.round((ahora.getTime() - new Date(leidoEn).getTime()) / MS_POR_SEGUNDO));
  return `VPS · ${nodo.cpu.total} vCPU · ${textoMemoriaNodo(nodo.memoriaMb.total)} · actualizado hace ${segundos} s`;
}

/** Suma la lectura a la serie de cada recurso y se queda con las últimas `max`. */
export function acumularSerie(serie: SerieNodo, vista: Pick<VistaInfraestructura, "tomado" | "nodo">, max = PUNTOS_SERIE_NODO): SerieNodo {
  const punto = (valor: number) => ({ tiempo: vista.tomado, valor });
  return {
    cpu: [...serie.cpu, punto(vista.nodo.cpu.usado)].slice(-max),
    memoria: [...serie.memoria, punto(vista.nodo.memoriaMb.usado)].slice(-max),
    disco: [...serie.disco, punto(vista.nodo.discoGb.usado)].slice(-max),
  };
}

const dos = (n: number) => String(n).padStart(2, "0");

/** En curso: «01:12» desde que empezó. Encolado: «espera 0:40». */
export function textoTrabajo({ estado, ms }: { estado: EstadoDespliegue; ms: number }): string {
  const total = Math.floor(ms / MS_POR_SEGUNDO);
  const minutos = Math.floor(total / SEGUNDOS_POR_MINUTO);
  const segundos = total % SEGUNDOS_POR_MINUTO;
  return ESTADOS_EN_CURSO.includes(estado) ? `${dos(minutos)}:${dos(segundos)}` : `espera ${minutos}:${dos(segundos)}`;
}

/** «0.12» o «—» si no hay muestra reciente. */
export function textoCpuEntorno(cpu: number | null): string {
  return cpu === null ? SIN_DATO : cpu.toFixed(DECIMALES_CPU);
}

export function textoMemoriaEntorno(mb: number | null): string {
  return mb === null ? SIN_DATO : textoMemoriaNodo(mb);
}

/** «6 de 41»: entornos con despliegue activo de todos los proyectos. */
export function textoEntornos(entornos: number, totalProyectos: number): string {
  return `${entornos} de ${totalProyectos}`;
}
