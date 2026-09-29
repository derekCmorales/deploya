import { DatosAltaInvalidos } from "./errores";
import { LONGITUD_MAX_SUBDOMINIO } from "./proyectos.constantes";

/**
 * Etiqueta DNS a partir del nombre: minúsculas, sin acentos, `[a-z0-9-]`, sin guion
 * al inicio ni al final y máximo 63 caracteres. Traefik rechaza cualquier otra cosa.
 */
export function subdominioDesdeNombre(nombre: string): string {
  const etiqueta = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, LONGITUD_MAX_SUBDOMINIO)
    .replace(/^-+|-+$/g, "");
  if (!etiqueta) throw new DatosAltaInvalidos("El nombre necesita al menos una letra o un número.");
  return etiqueta;
}
