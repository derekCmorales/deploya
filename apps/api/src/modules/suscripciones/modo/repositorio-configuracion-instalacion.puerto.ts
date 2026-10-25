import type { CodigoConfiguracion, CorreoGuardable, CorreoInstalacion, LimitesInstalacion, PoliticaRegistro } from "./configuracion-instalacion";

/** Repository de `ConfiguracionInstalacion` (M2/M9, un solo escritor: Javier). */
export abstract class RepositorioConfiguracionInstalacion {
  /** Sin fila, los valores por defecto de la columna. */
  abstract limites(): Promise<LimitesInstalacion>;
  /** El hash que dejó el instalador; `null` si no hay o ya se usó. */
  abstract codigo(): Promise<CodigoConfiguracion | null>;
  /** Borra el hash al crear el primer administrador: el código es de un solo uso. */
  abstract borrarCodigo(): Promise<void>;
  abstract hayAdministrador(): Promise<boolean>;
  /** Sin fila, `invitacion` (el valor de la columna). */
  abstract politicaRegistro(): Promise<PoliticaRegistro>;
  /** Admin · Instalación (SP-18): crean la fila si no existe. */
  abstract guardarPoliticaRegistro(politica: PoliticaRegistro): Promise<void>;
  abstract guardarLimites(limites: LimitesInstalacion): Promise<void>;
  /** Asistente 31 y Admin · Instalación (SP-17). Sin fila o sin datos, `entorno`. */
  abstract correo(): Promise<CorreoInstalacion>;
  /** Guardar un SMTP borra «sin correo» y al revés; crea la fila si no existe. */
  abstract guardarCorreo(correo: CorreoGuardable): Promise<void>;
}
