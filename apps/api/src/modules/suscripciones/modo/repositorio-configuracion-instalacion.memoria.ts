import { LIMITES_POR_DEFECTO, POLITICA_POR_DEFECTO, type CodigoConfiguracion, type LimitesInstalacion, type PoliticaRegistro } from "./configuracion-instalacion";
import { RepositorioConfiguracionInstalacion } from "./repositorio-configuracion-instalacion.puerto";

/** Doble en memoria para las pruebas: la misma fila única que en la base. */
export class RepositorioConfiguracionInstalacionMemoria extends RepositorioConfiguracionInstalacion {
  limitesGuardados: LimitesInstalacion = { ...LIMITES_POR_DEFECTO };
  codigoGuardado: CodigoConfiguracion | null = null;
  administradores = 0;
  politica: PoliticaRegistro = POLITICA_POR_DEFECTO;

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

  async politicaRegistro(): Promise<PoliticaRegistro> {
    return this.politica;
  }

  async guardarPoliticaRegistro(politica: PoliticaRegistro): Promise<void> {
    this.politica = politica;
  }

  async guardarLimites(limites: LimitesInstalacion): Promise<void> {
    this.limitesGuardados = { ...limites };
  }
}
