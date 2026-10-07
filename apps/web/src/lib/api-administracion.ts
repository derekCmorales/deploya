import { accesoDesdeRespuesta, type AccesoAdministracion } from "@/lib/acceso";
import { ErrorApi, pedirApi } from "@/lib/api";

const HTTP_OK = 200;

/** `GET /administracion/acceso`: la API decide con `RolGuard` si la sesión puede ver `/admin`. */
export async function consultarAccesoAdministracion(): Promise<AccesoAdministracion> {
  try {
    await pedirApi("/administracion/acceso");
    return accesoDesdeRespuesta(HTTP_OK, "");
  } catch (error) {
    if (error instanceof ErrorApi) return accesoDesdeRespuesta(error.estado, error.codigo);
    throw error;
  }
}
