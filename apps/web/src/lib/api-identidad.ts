import {
  resultadoIngreso,
  resultadoRegistro,
  resultadoVerificacion,
  type ResultadoIngreso,
  type ResultadoRegistro,
  type ResultadoVerificacion,
} from "@/lib/cuenta";

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
