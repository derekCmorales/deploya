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
  /** Tras crear el administrador: el código ya no vuelve a servir. */
  abstract consumirCodigo(): Promise<void>;
}
