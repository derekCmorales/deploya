import { LIMITES_POR_DEFECTO, type CodigoConfiguracion, type LimitesInstalacion } from "./configuracion-instalacion";
import { RepositorioConfiguracionInstalacion } from "./repositorio-configuracion-instalacion.puerto";

/** Doble en memoria para las pruebas: la misma fila única que en la base. */
export class RepositorioConfiguracionInstalacionMemoria extends RepositorioConfiguracionInstalacion {
  limitesGuardados: LimitesInstalacion = { ...LIMITES_POR_DEFECTO };
  codigoGuardado: CodigoConfiguracion | null = null;
  administradores = 0;

  async limites(): Promise<LimitesInstalacion> {
    return { ...this.limitesGuardados };
  }

  async codigo(): Promise<CodigoConfiguracion | null> {
    return this.codigoGuardado;
  }

  async borrarCodigo(): Promise<void> {
    this.codigoGuardado = null;
  }

  async hayAdministrador(): Promise<boolean> {
    return this.administradores > 0;
  }
}
