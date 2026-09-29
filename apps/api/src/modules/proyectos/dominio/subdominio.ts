import { DatosAltaInvalidos } from "./errores";
import { LONGITUD_MAX_SUBDOMINIO } from "./proyectos.constantes";

export function subdominioDesdeNombre(nombre: string): string {
  if (!nombre || typeof nombre !== "string") {
    throw new DatosAltaInvalidos("El nombre del proyecto es obligatorio.");
  }
  const normalizado = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalizado || normalizado.length === 0) {
    throw new DatosAltaInvalidos("El nombre del proyecto no genera un subdominio válido.");
  }

  if (normalizado.length > LONGITUD_MAX_SUBDOMINIO) {
    return normalizado.substring(0, LONGITUD_MAX_SUBDOMINIO).replace(/-+$/, "");
  }

  return normalizado;
}