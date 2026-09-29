import { ValidacionRepositorio } from "../dominio/proyecto";

export abstract class ProveedorFuente {
  /** Lanza RepositorioNoAccesible, RamaNoEncontrada o RepositorioSinDockerfile. */
  abstract validar(url: string, rama: string): Promise<ValidacionRepositorio>;
}