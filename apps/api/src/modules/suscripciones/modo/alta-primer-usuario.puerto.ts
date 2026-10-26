import type { CodigoConfiguracion } from "./configuracion-instalacion";

/**
 * Strategy (SP-06): cómo nace el primer administrador. En la nube lo crea el seed y no hay
 * primera configuración; en autoalojado sale del código de configuración del instalador. Lo usa
 * el asistente de Eddy (`POST /instalacion/codigo` y `/administrador`, SP-17).
 */
export abstract class AltaPrimerUsuario {
  /** `false` mientras falte el administrador: la web redirige a `/configurar`. */
  abstract configurada(): Promise<boolean>;
  /** 404 `PrimeraConfiguracionNoDisponible` · 401 `CodigoInvalido` · 410 `CodigoVencido`. */
  abstract validarCodigo(codigo: string): Promise<void>;
  /**
   * Justo antes de crear el administrador: valida y gasta el código en una sola escritura, así de
   * dos altas a la vez solo una pasa (la otra, 404). Devuelve lo gastado para `devolverCodigo`.
   */
  abstract consumirCodigo(codigo: string): Promise<CodigoConfiguracion>;
  /** Compensación: crear el administrador falló y el código vuelve a servir hasta su vencimiento. */
  abstract devolverCodigo(codigo: CodigoConfiguracion): Promise<void>;
}
