/**
 * 02 (a) solo muestra el correo enmascarado; para «Reenviar correo» hace falta el real. Se
 * guarda en la pestaña al crear la cuenta (01b), con la hora del envío para que 02 (a) llegue
 * con la cuenta atrás corriendo, y se lee en `/verificar`. Si el navegador no deja usar
 * `sessionStorage`, simplemente no hay botón.
 */

const CLAVE = "deploya-correo-pendiente";

export interface CorreoPendiente {
  correo: string;
  /** Milisegundos (época) en que 01b recibió la cuenta creada; `null` si no consta. */
  enviadoEn: number | null;
}

/** Lee lo guardado; acepta también el texto plano de versiones anteriores (solo el correo). */
export function correoPendienteDesde(texto: string | null): CorreoPendiente | null {
  if (!texto) return null;
  try {
    const leido = JSON.parse(texto) as Partial<CorreoPendiente>;
    if (typeof leido.correo !== "string" || leido.correo === "") return null;
    return { correo: leido.correo, enviadoEn: typeof leido.enviadoEn === "number" ? leido.enviadoEn : null };
  } catch {
    return { correo: texto, enviadoEn: null };
  }
}

export function guardarCorreoPendiente(correo: string, enviadoEn: number = Date.now()): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ correo: correo.trim(), enviadoEn }));
  } catch {
    // Sin almacenamiento de la pestaña: 02 (a) se muestra sin el botón de reenvío.
  }
}

export function leerCorreoPendiente(): CorreoPendiente | null {
  try {
    return correoPendienteDesde(sessionStorage.getItem(CLAVE));
  } catch {
    return null;
  }
}
