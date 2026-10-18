/**
 * Reintento del estado «Error de conexión con la API» de 28 (WEB-02). Lógica pura para
 * probarla con `node --test`.
 */

/** Segundos de espera de cada intento: 8, 16 y luego 30 s entre intentos (tope). */
const ESPERAS_S = [8, 16, 30];
const SIN_CONEXION = 0;
const HTTP_ERROR_SERVIDOR = 500;

export function esperaDeReintento(intento: number): number {
  return ESPERAS_S[Math.min(Math.max(intento, 0), ESPERAS_S.length - 1)];
}

/** Solo se reintenta solo cuando la API no responde o falla del lado del servidor; un 4xx no cambia reintentando. */
export function esFalloDeConexion(estado: number): boolean {
  return estado === SIN_CONEXION || estado >= HTTP_ERROR_SERVIDOR;
}

/** «GET /proyectos · sin-conexion · reintento en 8 s». */
export function detalleReintento(ruta: string, codigo: string, segundos: number): string {
  return `GET ${ruta} · ${codigo} · reintento en ${segundos} s`;
}
