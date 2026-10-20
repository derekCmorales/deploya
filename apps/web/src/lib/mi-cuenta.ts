/**
 * Lógica pura de «Mi cuenta» (M1-06 y M1-07, pantallas 05 y 05b). Sin imports para probarla
 * con `node --test`; las reglas de contraseña llegan ya evaluadas (`contrasenaValida`).
 */

/** Espejo de `LARGO_MAXIMO_NOMBRE` de la API; quien decide sigue siendo la API (`NombreInvalido`). */
export const LARGO_MAXIMO_NOMBRE = 64;

export const RUTA_CUENTA = "/cuenta";
export const RUTA_SEGURIDAD = "/cuenta/seguridad";

/** 05: «Máximo 64 caracteres.»; se cuenta el nombre ya recortado, como en la API. */
export function errorNombre(nombre: string): string | undefined {
  const recortado = nombre.trim();
  if (recortado.length === 0) return "Escribe tu nombre.";
  if (recortado.length > LARGO_MAXIMO_NOMBRE) return `Máximo ${LARGO_MAXIMO_NOMBRE} caracteres.`;
  return undefined;
}

export interface DatosContrasena {
  actual: string;
  nueva: string;
  confirmacion: string;
}

export type ErroresContrasena = Partial<Record<keyof DatosContrasena, string>>;

/** 05b: «Confirmar» distinto de «Nueva contraseña» bloquea el envío, igual que una nueva débil o igual a la actual. */
export function erroresContrasena(datos: DatosContrasena, nuevaCumple: boolean): ErroresContrasena {
  const errores: ErroresContrasena = {};
  if (datos.actual === "") errores.actual = "Escribe tu contraseña actual.";
  if (!nuevaCumple) errores.nueva = "Mínimo 12 caracteres, mayúsculas y minúsculas, un número y un símbolo.";
  else if (datos.actual !== "" && datos.nueva === datos.actual) errores.nueva = "La nueva contraseña debe ser distinta de la actual.";
  if (datos.confirmacion !== datos.nueva) errores.confirmacion = "Las contraseñas no coinciden.";
  return errores;
}

export type ResultadoCambioContrasena =
  | { tipo: "cambiada" }
  | { tipo: "actual-incorrecta" }
  | { tipo: "error"; mensaje: string };

const HTTP_SIN_CONTENIDO = 204;
const HTTP_SOLICITUD_INVALIDA = 400;
const MENSAJE_CAMBIO = "No pudimos cambiar la contraseña. Intenta de nuevo en unos segundos.";

/** Respuesta de `POST /identidad/cuenta/contrasena` → lo que muestra 05b. */
export function resultadoCambioContrasena(estado: number, codigo: string, mensaje: string): ResultadoCambioContrasena {
  if (estado === HTTP_SIN_CONTENIDO) return { tipo: "cambiada" };
  if (codigo === "ContrasenaActualIncorrecta") return { tipo: "actual-incorrecta" };
  if (estado === HTTP_SOLICITUD_INVALIDA) return { tipo: "error", mensaje };
  return { tipo: "error", mensaje: MENSAJE_CAMBIO };
}

const NOMBRE_ROL: Record<string, string> = { cliente: "Cliente", administrador: "Administrador" };

/** «Cliente» / «Administrador» (05, fila Rol). */
export function nombreDeRol(rol: string): string {
  return NOMBRE_ROL[rol] ?? rol;
}
