import type { ConsultaRepositorio, ValidacionRepositorio } from "../dominio/proyecto";

/**
 * Fuente del código (Adapter). Hoy solo GitHub público; otra fuente es otra
 * implementación, no un `if` en el servicio.
 */
export abstract class ProveedorFuente {
  /**
   * Lanza `RepositorioNoAccesible`, `RamaNoEncontrada`, `RepositorioSinDockerfile`
   * o `FuenteNoDisponible`.
   */
  abstract validar(consulta: ConsultaRepositorio): Promise<ValidacionRepositorio>;
}