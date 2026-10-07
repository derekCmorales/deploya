/**
 * 02 (a) solo muestra el correo enmascarado; para «Reenviar correo» hace falta el real. Se
 * guarda en la pestaña al crear la cuenta (01b) y se lee en `/verificar`. Si el navegador
 * no deja usar `sessionStorage`, simplemente no hay botón.
 */

const CLAVE = "deploya-correo-pendiente";

export function guardarCorreoPendiente(correo: string): void {
  try {
    sessionStorage.setItem(CLAVE, correo.trim());
  } catch {
    // Sin almacenamiento de la pestaña: 02 (a) se muestra sin el botón de reenvío.
  }
}

export function leerCorreoPendiente(): string | null {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}
