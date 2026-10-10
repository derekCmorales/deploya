import type { LectorFuente } from "../../construccion/puertos/lector-fuente.puerto";
import type { ConsultaRepositorio, ValidacionRepositorio } from "../dominio/proyecto";

/**
 * Fuente del código (Adapter). Hoy solo GitHub público; otra fuente es otra
 * implementación, no un `if` en el servicio.
 */
export abstract class ProveedorFuente {
  /**
   * Lanza `RepositorioNoAccesible`, `RamaNoEncontrada` o `FuenteNoDisponible`.
   * Sin Dockerfile, `dockerfile` llega `null` para que M4 intente una receta.
   */
  abstract validar(consulta: ConsultaRepositorio): Promise<ValidacionRepositorio>;

  /** Archivos de esa rama, para `DeteccionStackService` (contrato v2). */
  abstract lector(consulta: ConsultaRepositorio): LectorFuente;
}
