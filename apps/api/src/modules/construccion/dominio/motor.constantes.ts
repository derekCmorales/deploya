/** Tiempos y límites del motor. Cambiarlos aquí cambia el comportamiento en todas partes. */
export const TIEMPO_MAXIMO_CONSTRUCCION_MS = 10 * 60 * 1000;
export const TIEMPO_MAXIMO_SALUD_MS = 60 * 1000;
export const INTERVALO_SALUD_MS = 1000;
export const LINEAS_POR_PAGINA = 500;
export const LOTE_BITACORA_MS = 500;
export const LOTE_BITACORA_LINEAS = 50;
export const LARGO_MAXIMO_LINEA = 4000;
export const PUERTO_POR_DEFECTO = 8080;
export const RUTA_SALUD = "/";
export const PREFIJO_IMAGEN = "deploya";
export const PREFIJO_RED_PROYECTO = "deploya-p-";
export const COLA_DESPLIEGUES = "despliegues";

export function etiquetaImagen(subdominio: string, numero: number): string {
  return `${PREFIJO_IMAGEN}/${subdominio}:${numero}`;
}

export function nombreContenedor(subdominio: string, numero: number): string {
  return `${PREFIJO_IMAGEN}-${subdominio}-${numero}`;
}

export function redDeProyecto(subdominio: string): string {
  return `${PREFIJO_RED_PROYECTO}${subdominio}`;
}
