import type { CodigoConfiguracion, LimitesInstalacion } from "./configuracion-instalacion";

/** Repository de `ConfiguracionInstalacion` (M2/M9, un solo escritor: Javier). */
export abstract class RepositorioConfiguracionInstalacion {
  /** Sin fila, los valores por defecto de la columna. */
  abstract limites(): Promise<LimitesInstalacion>;
  /** El hash que dejó el instalador; `null` si no hay o ya se usó. */
  abstract codigo(): Promise<CodigoConfiguracion | null>;
  /** Borra el hash al crear el primer administrador: el código es de un solo uso. */
  abstract borrarCodigo(): Promise<void>;
  abstract hayAdministrador(): Promise<boolean>;
}
