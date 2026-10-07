import { ErrorApi, pedirApi } from "@/lib/api";
import {
  resultadoIngreso,
  resultadoRegistro,
  resultadoRestablecer,
  resultadoSolicitudRecuperacion,
  resultadoVerificacion,
  type ResultadoIngreso,
  type ResultadoRegistro,
  type ResultadoRestablecer,
  type ResultadoSolicitudRecuperacion,
  type ResultadoVerificacion,
} from "@/lib/cuenta";
import { resultadoReenvio, type ResultadoReenvio } from "@/lib/reenvio";

const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Metodo = "GET" | "POST" | "DELETE";

/** `credentials: "include"`: la API pone y lee la cookie de sesión HttpOnly. */
async function llamar(
  ruta: string,
  metodo: Metodo,
  cuerpo?: unknown,
): Promise<{ estado: number; json: Record<string, unknown> }> {
  const respuesta = await fetch(`${URL_API}${ruta}`, {
    method: metodo,
    credentials: "include",
    headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const json = (await respuesta.json().catch(() => ({}))) as Record<string, unknown>;
  return { estado: respuesta.status, json };
}

/** `POST /identidad/registro` (pantallas 01 y 01b). */
export async function registrarCuenta(correo: string, contrasena: string, confirmacion: string): Promise<ResultadoRegistro> {
  try {
    const { estado, json } = await llamar("/identidad/registro", "POST", { correo, contrasena, confirmacion });
    return resultadoRegistro(estado, json);
  } catch {
    return resultadoRegistro(0, {});
  }
}

/** `POST /identidad/verificacion` (pantalla 02). */
export async function verificarCorreo(token: string): Promise<ResultadoVerificacion> {
  try {
    const { estado, json } = await llamar("/identidad/verificacion", "POST", { token });
    return resultadoVerificacion(estado, json);
  } catch {
    return "error";
  }
}

/** `POST /identidad/sesion` (pantallas 03 y 03b). */
export async function iniciarSesion(correo: string, contrasena: string): Promise<ResultadoIngreso> {
  try {
    const { estado, json } = await llamar("/identidad/sesion", "POST", { correo, contrasena });
    return resultadoIngreso(estado, json);
  } catch {
    return resultadoIngreso(0, {});
  }
}

/** `POST /identidad/recuperacion` (pantalla 04, paso 1): respuesta neutra. */
export async function solicitarRecuperacion(correo: string): Promise<ResultadoSolicitudRecuperacion> {
  try {
    const { estado } = await llamar("/identidad/recuperacion", "POST", { correo });
    return resultadoSolicitudRecuperacion(estado);
  } catch {
    return "error";
  }
}

/** `POST /identidad/recuperacion/restablecer` (pantalla 04, paso 2). */
export async function restablecerContrasena(token: string, contrasena: string, confirmacion: string): Promise<ResultadoRestablecer> {
  try {
    const { estado, json } = await llamar("/identidad/recuperacion/restablecer", "POST", { token, contrasena, confirmacion });
    return resultadoRestablecer(estado, json);
  } catch {
    return resultadoRestablecer(0, {});
  }
}

export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string;
  rol: "cliente" | "administrador";
}

/** `GET /identidad/sesion`: el usuario de la cookie, o `null` si no hay sesión vigente. */
export async function leerSesion(): Promise<UsuarioSesion | null> {
  const { estado, json } = await llamar("/identidad/sesion", "GET");
  if (estado !== 200) return null;
  return json.usuario as UsuarioSesion;
}

/** `DELETE /identidad/sesion`. */
export async function cerrarSesion(): Promise<void> {
  await llamar("/identidad/sesion", "DELETE").catch(() => undefined);
}

/** Pantallas 02 y 03b: por el correo, o por el token del enlace vencido en 02 (c). */
export type DestinoReenvio = { correo: string } | { token: string };

const HTTP_ACEPTADO = 202;

/** `POST /identidad/verificacion/reenvio`: 202 neutro o 429 con los segundos que faltan. */
export async function reenviarVerificacion(destino: DestinoReenvio): Promise<ResultadoReenvio> {
  try {
    const { segundos } = await pedirApi<{ segundos?: number }>("/identidad/verificacion/reenvio", { metodo: "POST", cuerpo: destino });
    return resultadoReenvio(HTTP_ACEPTADO, "", segundos);
  } catch (error) {
    if (error instanceof ErrorApi) return resultadoReenvio(error.estado, error.codigo, error.detalle.segundos);
    throw error;
  }
}
