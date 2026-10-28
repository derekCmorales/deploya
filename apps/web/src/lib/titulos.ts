/**
 * Títulos de pestaña (EST-01c). El layout raíz aplica la plantilla de Next y cada página
 * aporta solo su nombre, para que la pestaña diga «<página> · Deploya» una sola vez.
 */

export const TITULO_BASE = "Deploya";
export const PLANTILLA_TITULO = "%s · Deploya";
export const DESCRIPCION_SITIO = "PaaS de alojamiento: de un repositorio a un servicio en línea con HTTPS.";

/** Lo que verá la pestaña de una página cuyo `title` es `nombre`. */
export function tituloDePagina(nombre: string): string {
  return PLANTILLA_TITULO.replace("%s", nombre);
}
