import { ErrorApi, pedirApi } from "@/lib/api";
import { resultadoCambioContrasena, type ResultadoCambioContrasena } from "@/lib/mi-cuenta";

/** `GET /identidad/cuenta` (pantalla 05). Las fechas llegan en ISO 8601. */
export interface PerfilCuenta {
  nombre: string;
  correo: string;
  rol: "cliente" | "administrador";
  verificado: boolean;
  creado: string;
}

const HTTP_SIN_CONTENIDO = 204;

export function leerPerfil(): Promise<PerfilCuenta> {
  return pedirApi<PerfilCuenta>("/identidad/cuenta");
}

/** `PATCH /identidad/cuenta`: un nombre fuera de 1–64 caracteres llega como `ErrorApi` `NombreInvalido`. */
export function guardarNombre(nombre: string): Promise<PerfilCuenta> {
  return pedirApi<PerfilCuenta>("/identidad/cuenta", { metodo: "PATCH", cuerpo: { nombre } });
}

/** `POST /identidad/cuenta/contrasena` (05b): cierra las otras sesiones, no esta. */
export async function cambiarContrasena(actual: string, nueva: string): Promise<ResultadoCambioContrasena> {
  try {
    await pedirApi("/identidad/cuenta/contrasena", { metodo: "POST", cuerpo: { actual, nueva } });
    return resultadoCambioContrasena(HTTP_SIN_CONTENIDO, "", "");
  } catch (error) {
    if (error instanceof ErrorApi) return resultadoCambioContrasena(error.estado, error.codigo, error.message);
    throw error;
  }
}

/** `DELETE /identidad/sesiones` (05b «Cerrar todas»): todas, incluida esta; la API vence la cookie. */
export async function cerrarTodasLasSesiones(): Promise<void> {
  await pedirApi("/identidad/sesiones", { metodo: "DELETE" });
}
