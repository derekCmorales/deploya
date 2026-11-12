/** Tiempos y límites del motor. Cambiarlos aquí cambia el comportamiento en todas partes. */
const MS_POR_MINUTO = 60 * 1000;
/** Por omisión de `MOTOR_TIEMPO_MAXIMO_CONSTRUCCION_MIN` (feat/m5-recursos-datos: un monorepo con varias apps no cabe en 10). */
export const MINUTOS_MAXIMOS_CONSTRUCCION_POR_OMISION = 20;
export const TIEMPO_MAXIMO_CONSTRUCCION_MS = MINUTOS_MAXIMOS_CONSTRUCCION_POR_OMISION * MS_POR_MINUTO;
/** Token de Nest con el tope de `docker build` en milisegundos, leído de la configuración del motor. */
export const TIEMPO_MAXIMO_CONSTRUCCION = Symbol("TIEMPO_MAXIMO_CONSTRUCCION");

/** Minutos de la configuración → milisegundos; un valor ausente, no numérico o ≤ 0 vuelve al de omisión. */
export function tiempoMaximoConstruccionMs(minutos: string | undefined): number {
  const valor = Number(minutos);
  if (!minutos || !Number.isFinite(valor) || valor <= 0) return TIEMPO_MAXIMO_CONSTRUCCION_MS;
  return Math.round(valor * MS_POR_MINUTO);
}
export const TIEMPO_MAXIMO_SALUD_MS = 60 * 1000;
export const INTERVALO_SALUD_MS = 1000;
export const LINEAS_POR_PAGINA = 500;
/** Cada cuánto el trabajador pregunta si pidieron cancelar el despliegue en curso (M4-02). */
export const INTERVALO_VIGIA_MS = 1000;
/** La señal de cancelación caduca sola: el trabajador la debe ver mucho antes. */
export const TTL_CANCELACION_S = 600;
export const LOTE_BITACORA_MS = 500;
export const LOTE_BITACORA_LINEAS = 50;
export const LARGO_MAXIMO_LINEA = 4000;
export const PUERTO_POR_DEFECTO = 8080;
export const RUTA_SALUD = "/";
export const PREFIJO_IMAGEN = "deploya";
export const PREFIJO_RED_PROYECTO = "deploya-p-";
export const COLA_DESPLIEGUES = "despliegues";
/** Cola de acciones sobre el contenedor (M5-02): una acción de segundos no espera detrás de un build. */
export const COLA_OPERACION = "operacion";
/** Lecturas de `docker logs` que la API pide al trabajador (SP-12): petición y respuesta, sin guardar nada. */
export const COLA_BITACORAS = "bitacoras";

export function etiquetaImagen(subdominio: string, numero: number): string {
  return `${PREFIJO_IMAGEN}/${subdominio}:${numero}`;
}

export function nombreContenedor(subdominio: string, numero: number): string {
  return `${PREFIJO_IMAGEN}-${subdominio}-${numero}`;
}

export function redDeProyecto(subdominio: string): string {
  return `${PREFIJO_RED_PROYECTO}${subdominio}`;
}
