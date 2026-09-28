/**
 * Lógica pura de las pantallas de cuenta (01, 01b, 02). Sin imports para poder probarla
 * con `node --test`; las reglas de contraseña llegan ya evaluadas (`REGLAS_CONTRASENA`).
 */

export interface DatosRegistro {
  correo: string;
  contrasena: string;
  confirmacion: string;
}

export type ErroresRegistro = Partial<Record<keyof DatosRegistro, string>>;

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function erroresRegistro(datos: DatosRegistro, contrasenaCumple: boolean): ErroresRegistro {
  const errores: ErroresRegistro = {};
  if (!FORMATO_CORREO.test(datos.correo.trim())) errores.correo = "Escribe un correo válido.";
  if (!contrasenaCumple) errores.contrasena = "La contraseña no cumple los requisitos.";
  if (datos.confirmacion !== datos.contrasena) errores.confirmacion = "Las contraseñas no coinciden.";
  return errores;
}

/** Códigos de error de la API de identidad (`codigo` en el cuerpo) → qué muestra la pantalla. */
export type ResultadoRegistro =
  | { tipo: "creada"; correoEnmascarado: string; correoEnviado: boolean }
  | { tipo: "correo-registrado" }
  | { tipo: "error"; mensaje: string };

const MENSAJE_GENERICO = "No pudimos crear la cuenta. Intenta de nuevo en unos segundos.";

export function resultadoRegistro(estado: number, cuerpo: Record<string, unknown>): ResultadoRegistro {
  if (estado === 201 && typeof cuerpo.correoEnmascarado === "string") {
    return { tipo: "creada", correoEnmascarado: cuerpo.correoEnmascarado, correoEnviado: cuerpo.correoEnviado !== false };
  }
  if (cuerpo.codigo === "CorreoYaRegistrado") return { tipo: "correo-registrado" };
  if (typeof cuerpo.mensaje === "string" && estado === 400) return { tipo: "error", mensaje: cuerpo.mensaje };
  return { tipo: "error", mensaje: MENSAJE_GENERICO };
}

/** Pantalla 02: (b) cuenta activada o (c) enlace no válido; otro fallo es un error de red o de API. */
export type ResultadoVerificacion = "activada" | "no-valido" | "error";

export function resultadoVerificacion(estado: number, cuerpo: Record<string, unknown>): ResultadoVerificacion {
  if (estado === 200) return "activada";
  if (cuerpo.codigo === "TokenNoValido" || estado === 400) return "no-valido";
  return "error";
}
