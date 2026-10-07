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

/**
 * Pantalla 02: (b) cuenta activada o (c) enlace no válido. Un 200 con otro estado (una cuenta
 * suspendida) no se muestra como activada. Cualquier otro fallo es un error de red o de API.
 */
export type ResultadoVerificacion = "activada" | "no-activada" | "no-valido" | "error";

export function resultadoVerificacion(estado: number, cuerpo: Record<string, unknown>): ResultadoVerificacion {
  if (estado === 200) return cuerpo.estadoCuenta === "activa" ? "activada" : "no-activada";
  if (cuerpo.codigo === "TokenNoValido" || estado === 400) return "no-valido";
  return "error";
}

/** Pantallas 03 y 03b: qué muestra el formulario según la respuesta de `POST /identidad/sesion`. */
export type ResultadoIngreso =
  | { tipo: "dentro" }
  | { tipo: "credenciales" }
  | { tipo: "sin-verificar"; correoEnmascarado: string }
  | { tipo: "suspendida"; motivo: string | null; desde: string | null }
  | { tipo: "error"; mensaje: string };

const MENSAJE_INGRESO = "No pudimos iniciar sesión. Intenta de nuevo en unos segundos.";

export function resultadoIngreso(estado: number, cuerpo: Record<string, unknown>): ResultadoIngreso {
  if (estado === 200) return { tipo: "dentro" };
  if (cuerpo.codigo === "CredencialesInvalidas") return { tipo: "credenciales" };
  if (cuerpo.codigo === "CuentaNoVerificada") {
    return { tipo: "sin-verificar", correoEnmascarado: typeof cuerpo.correoEnmascarado === "string" ? cuerpo.correoEnmascarado : "tu correo" };
  }
  if (cuerpo.codigo === "CuentaSuspendida") {
    const texto = (valor: unknown) => (typeof valor === "string" && valor !== "" ? valor : null);
    return { tipo: "suspendida", motivo: texto(cuerpo.motivo), desde: texto(cuerpo.desde) };
  }
  return { tipo: "error", mensaje: MENSAJE_INGRESO };
}

export const DESTINO_POR_DEFECTO = "/projects";

/** A dónde volver tras iniciar sesión: solo rutas propias («/x»), nunca otro sitio («//x», «https://…»). */
export function destinoTrasIngreso(siguiente: string | null | undefined): string {
  if (!siguiente || !siguiente.startsWith("/") || siguiente.startsWith("//") || siguiente.startsWith("/\\")) {
    return DESTINO_POR_DEFECTO;
  }
  return siguiente;
}

/** Pantalla 04 · paso 1: solo se valida el formato; la respuesta de la API es neutra. */
export function errorCorreoRecuperacion(correo: string): string | null {
  return FORMATO_CORREO.test(correo.trim()) ? null : "Escribe un correo válido.";
}

/**
 * Pantalla 04 · paso 1: un 202 es siempre «Revisa tu correo», exista o no la cuenta. La web
 * no distingue nada más: así tampoco puede revelar si el correo está registrado.
 */
export type ResultadoSolicitudRecuperacion = "enviada" | "error";

export function resultadoSolicitudRecuperacion(estado: number): ResultadoSolicitudRecuperacion {
  return estado === 202 ? "enviada" : "error";
}

/** Pantalla 04 · paso 2: los mismos requisitos y la misma confirmación que el registro. */
export function erroresContrasenaNueva(
  datos: Pick<DatosRegistro, "contrasena" | "confirmacion">,
  contrasenaCumple: boolean,
): Omit<ErroresRegistro, "correo"> {
  const errores: Omit<ErroresRegistro, "correo"> = {};
  if (!contrasenaCumple) errores.contrasena = "La contraseña no cumple los requisitos.";
  if (datos.confirmacion !== datos.contrasena) errores.confirmacion = "Las contraseñas no coinciden.";
  return errores;
}

/** Pantalla 04 · paso 2: 204 vuelve a `/ingresar`; 410 es «Este enlace ya no sirve». */
export type ResultadoRestablecer = { tipo: "restablecida" } | { tipo: "enlace-no-sirve" } | { tipo: "error"; mensaje: string };

const MENSAJE_RESTABLECER = "No pudimos guardar la contraseña. Intenta de nuevo en unos segundos.";

export function resultadoRestablecer(estado: number, cuerpo: Record<string, unknown>): ResultadoRestablecer {
  if (estado === 204) return { tipo: "restablecida" };
  if (cuerpo.codigo === "TokenNoValido") return { tipo: "enlace-no-sirve" };
  if (estado === 400 && typeof cuerpo.mensaje === "string") return { tipo: "error", mensaje: cuerpo.mensaje };
  return { tipo: "error", mensaje: MENSAJE_RESTABLECER };
}

/** `/ingresar?restablecida=1`: aviso «Contraseña actualizada» tras el paso 2 de 04. */
export const DESTINO_TRAS_RESTABLECER = "/ingresar?restablecida=1";
