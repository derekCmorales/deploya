import type { LineaSalida } from "../../../orquestacion/puertos/contenedor.puerto";

export type NivelEjecucion = "info" | "aviso" | "error";

/** «Últimas 500 líneas del contenedor» (pantalla 15). */
export const MAX_LINEAS_EJECUCION = 500;
export const AVISO_CONTENEDOR_DETENIDO = "El contenedor no está corriendo";
export const AVISO_SIN_CONTENEDOR = "Todavía no hay un contenedor que leer";

const PREFIJO_ERROR = /^\s*\[?(ERROR|ERR|FATAL|PANIC)\b/i;
const PREFIJO_AVISO = /^\s*\[?(WARN|WARNING)\b/i;

/** Heurística por prefijo (design.md §2): lo que no empieza con ERROR o WARN es Info. */
export function nivelDe(texto: string): NivelEjecucion {
  if (PREFIJO_ERROR.test(texto)) return "error";
  if (PREFIJO_AVISO.test(texto)) return "aviso";
  return "info";
}

export interface LineaEjecucion {
  en: Date;
  texto: string;
  nivel: NivelEjecucion;
}

export interface RespuestaBitacora {
  /** El despliegue activo cuyo contenedor se lee; `null` si no hay. */
  despliegue: { numero: number; commit: string | null } | null;
  lineas: LineaEjecucion[];
  /** Por qué no hay líneas nuevas que esperar; `null` si el contenedor corre. */
  aviso: string | null;
}

/**
 * Docker filtra `since` por segundos: aquí se descarta lo que no es estrictamente posterior a
 * `desde`, para que la web no reciba dos veces la misma línea entre consultas.
 */
export function lineasEjecucion(salida: readonly LineaSalida[], desde: Date | null): LineaEjecucion[] {
  return salida
    .filter((linea) => !desde || linea.marca > desde)
    .slice(-MAX_LINEAS_EJECUCION)
    .map((linea) => ({ en: linea.marca, texto: linea.texto, nivel: nivelDe(linea.texto) }));
}
