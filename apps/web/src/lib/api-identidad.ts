import {
  resultadoRegistro,
  resultadoVerificacion,
  type ResultadoRegistro,
  type ResultadoVerificacion,
} from "@/lib/cuenta";

const URL_API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function publicar(ruta: string, cuerpo: unknown): Promise<{ estado: number; json: Record<string, unknown> }> {
  const respuesta = await fetch(`${URL_API}${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const json = (await respuesta.json().catch(() => ({}))) as Record<string, unknown>;
  return { estado: respuesta.status, json };
}

/** `POST /identidad/registro` (pantallas 01 y 01b). */
export async function registrarCuenta(correo: string, contrasena: string, confirmacion: string): Promise<ResultadoRegistro> {
  try {
    const { estado, json } = await publicar("/identidad/registro", { correo, contrasena, confirmacion });
    return resultadoRegistro(estado, json);
  } catch {
    return resultadoRegistro(0, {});
  }
}

/** `POST /identidad/verificacion` (pantalla 02). */
export async function verificarCorreo(token: string): Promise<ResultadoVerificacion> {
  try {
    const { estado, json } = await publicar("/identidad/verificacion", { token });
    return resultadoVerificacion(estado, json);
  } catch {
    return "error";
  }
}
