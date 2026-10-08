/**
 * Reenvío de la verificación (M1-04, pantallas 02 y 03b). Sin imports para probarlo con
 * `node --test`. La cuenta atrás arranca del número que devuelve la API, no se inventa aquí.
 */

const SEGUNDOS_POR_MINUTO = 60;
const MS_POR_SEGUNDO = 1000;
/** Espejo de `ESPERA_REENVIO_MS` de la API (60 s); quien decide sigue siendo la API. */
export const ESPERA_REENVIO_S = 60;
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

/**
 * 02 (a) al llegar desde 01b: lo que falta de la espera desde que se envió el primer correo,
 * para que el botón aparezca deshabilitado con la cuenta atrás corriendo (artboard 02 a).
 */
export function segundosTrasEnvio(enviadoEn: number | null, ahora: number): number {
  if (enviadoEn === null) return 0;
  const faltanMs = ESPERA_REENVIO_S * MS_POR_SEGUNDO - (ahora - enviadoEn);
  return faltanMs > 0 ? Math.min(ESPERA_REENVIO_S, Math.ceil(faltanMs / MS_POR_SEGUNDO)) : 0;
}

/** El botón se habilita cuando la cuenta atrás llega a cero. */
export function puedeReenviar(segundos: number): boolean {
  return segundos <= 0;
}
