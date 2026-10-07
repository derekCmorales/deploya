/**
 * Reenvío de la verificación (M1-04, pantallas 02 y 03b). Sin imports para probarlo con
 * `node --test`. La cuenta atrás arranca del número que devuelve la API, no se inventa aquí.
 */

const SEGUNDOS_POR_MINUTO = 60;
const HTTP_ACEPTADO = 202;
const HTTP_DEMASIADAS_SOLICITUDES = 429;

/** «0:42», «1:00»: lo que acompaña a «Reenviar correo ·» mientras corre la cuenta atrás. */
export function formatoCuentaAtras(segundos: number): string {
  const total = Math.max(0, Math.ceil(segundos));
  const minutos = Math.floor(total / SEGUNDOS_POR_MINUTO);
  return `${minutos}:${String(total % SEGUNDOS_POR_MINUTO).padStart(2, "0")}`;
}

export type ResultadoReenvio =
  | { tipo: "enviado"; segundos: number }
  | { tipo: "esperar"; segundos: number }
  | { tipo: "error"; mensaje: string };

const MENSAJE_REENVIO = "No pudimos reenviar el correo. Intenta de nuevo en unos segundos.";

/** 202 neutro y 429 `EsperaReenvio` traen `segundos`: los dos arrancan la cuenta atrás. */
export function resultadoReenvio(estado: number, codigo: string, segundos: unknown): ResultadoReenvio {
  const espera = typeof segundos === "number" && segundos > 0 ? segundos : 0;
  if (estado === HTTP_ACEPTADO) return { tipo: "enviado", segundos: espera };
  if (estado === HTTP_DEMASIADAS_SOLICITUDES && codigo === "EsperaReenvio") return { tipo: "esperar", segundos: espera };
  return { tipo: "error", mensaje: MENSAJE_REENVIO };
}

/** El botón se habilita cuando la cuenta atrás llega a cero. */
export function puedeReenviar(segundos: number): boolean {
  return segundos <= 0;
}
