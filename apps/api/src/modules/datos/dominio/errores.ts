/** Estados HTTP con nombre: el dominio no importa Nest. */
export const HTTP_SOLICITUD_INVALIDA = 400;
export const HTTP_NO_ENCONTRADO = 404;
export const HTTP_CONFLICTO = 409;

/** Errores de recursos de datos; `ErroresDatosFilter` los traduce a `{ codigo, mensaje }` (recursos-datos.md). */
export abstract class ErrorDatos extends Error {
  abstract readonly codigo: string;
  abstract readonly estadoHttp: number;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class LimiteRecursosDatos extends ErrorDatos {
  readonly codigo = "LIMITE_RECURSOS_DATOS";
  readonly estadoHttp = HTTP_CONFLICTO;

  constructor(readonly maximo: number) {
    super(`Tu plan permite ${maximo} ${maximo === 1 ? "base de datos" : "bases de datos"}: elimina una o cambia de plan.`);
  }
}

export class TipoYaConectado extends ErrorDatos {
  readonly codigo = "TIPO_YA_CONECTADO";
  readonly estadoHttp = HTTP_CONFLICTO;

  constructor(readonly tipo: string) {
    super(`El proyecto ya tiene un recurso ${tipo} conectado (propio o compartido).`);
  }
}

/** Mismo bloqueo que los despliegues (M5-03): con la suscripción Vencida o Suspendida no se crean recursos. */
export class SuscripcionBloqueada extends ErrorDatos {
  readonly codigo = "SUSCRIPCION_BLOQUEADA";
  readonly estadoHttp = HTTP_CONFLICTO;

  constructor(readonly estado: string) {
    super(`Tu suscripción está ${estado}: renuévala para crear bases de datos.`);
  }
}

export class ProyectoDatosNoEncontrado extends ErrorDatos {
  readonly codigo = "PROYECTO_NO_ENCONTRADO";
  readonly estadoHttp = HTTP_NO_ENCONTRADO;

  constructor(readonly proyectoId: string) {
    super("No encontramos ese proyecto.");
  }
}

export class RecursoNoEncontrado extends ErrorDatos {
  readonly codigo = "RECURSO_NO_ENCONTRADO";
  readonly estadoHttp = HTTP_NO_ENCONTRADO;

  constructor(readonly recursoId: string) {
    super("No encontramos ese recurso de datos en el proyecto.");
  }
}

export class ConfirmacionRecursoNoCoincide extends ErrorDatos {
  readonly codigo = "CONFIRMACION_NO_COINCIDE";
  readonly estadoHttp = HTTP_SOLICITUD_INVALIDA;

  constructor(readonly tipo: string) {
    super(`Escribe «${tipo}» para confirmar.`);
  }
}

export class DatosSolicitudInvalidos extends ErrorDatos {
  readonly codigo = "DATOS_INVALIDOS";
  readonly estadoHttp = HTTP_SOLICITUD_INVALIDA;
}
