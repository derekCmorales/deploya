/**
 * Lógica pura del acceso a administración (M1-04, pantalla 28 · 403). Sin imports para
 * probarla con `node --test`.
 */

export type AccesoAdministracion = "permitido" | "solo-administracion" | "sin-sesion" | "error";

const HTTP_OK = 200;
const HTTP_NO_AUTENTICADO = 401;
const HTTP_PROHIBIDO = 403;

/** Traduce la respuesta de `GET /administracion/acceso` a lo que muestra `/admin`. */
export function accesoDesdeRespuesta(estado: number, codigo: string): AccesoAdministracion {
  if (estado === HTTP_OK) return "permitido";
  if (estado === HTTP_PROHIBIDO && codigo === "SoloAdministracion") return "solo-administracion";
  if (estado === HTTP_NO_AUTENTICADO) return "sin-sesion";
  return "error";
}

const NOMBRE_ROL: Record<string, string> = { cliente: "Cliente", administrador: "Administrador" };

/** «Tu cuenta es de tipo Cliente» (ficha 28): el rol de la API con su nombre visible. */
export function nombreRol(rol: string | null | undefined): string {
  return (rol && NOMBRE_ROL[rol]) || "Cliente";
}
