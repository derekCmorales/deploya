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

/**
 * Nombres que la plataforma usa en el VPS (la web va en la raíz y la API en `api.`): un proyecto con
 * uno de ellos publicaría una ruta que choca con la de la plataforma (ADR 0007). Solo se aplican donde
 * hay esas rutas (con resolvedor ACME): en local `api.localhost` no choca con nada.
 */
export const SUBDOMINIOS_DE_PLATAFORMA: readonly string[] = ["api", "www", "web", "app", "admin", "mail", "smtp", "traefik"];

/** Token de Nest con los subdominios que un proyecto no puede usar en este entorno. */
export const SUBDOMINIOS_RESERVADOS = Symbol("SUBDOMINIOS_RESERVADOS");

export function esSubdominioReservado(subdominio: string, reservados: readonly string[]): boolean {
  return reservados.includes(subdominio);
}
