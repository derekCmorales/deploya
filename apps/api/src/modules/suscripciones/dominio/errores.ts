/**
 * Errores de dominio de M2. Cada uno lleva el `codigo` que la web usa para elegir
 * el mensaje de 07, 07b y 08; `ErroresSuscripcionesFilter` los traduce a HTTP.
 */
export abstract class ErrorSuscripciones extends Error {
  abstract readonly codigo: string;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }

  /** Datos que la web necesita además del mensaje. */
  detalle(): Record<string, unknown> {
    return {};
  }
}

export class SuscripcionNoEncontrada extends ErrorSuscripciones {
  readonly codigo = "sin-suscripcion";

  constructor(readonly usuarioId: string) {
    super(`La cuenta ${usuarioId} no tiene suscripción`);
  }
}

export class PlanNoEncontrado extends ErrorSuscripciones {
  readonly codigo = "plan-no-encontrado";

  constructor(readonly plan: string) {
    super(`No existe el plan ${plan}; corre el seed`);
  }

  detalle(): Record<string, unknown> {
    return { plan: this.plan };
  }
}

export class DatosPagoInvalidos extends ErrorSuscripciones {
  readonly codigo = "datos-invalidos";
}

export class VigenciaNoDisponible extends ErrorSuscripciones {
  readonly codigo = "vigencia-no-disponible";

  constructor(readonly plan: string, readonly vigenciaDias: number) {
    super(`El plan ${plan} no se vende por ${vigenciaDias} días.`);
  }
}

/** El plan destino no se paga: para bajar a él se programa un descenso. */
export class PlanSinCobro extends ErrorSuscripciones {
  readonly codigo = "plan-sin-cobro";

  constructor(readonly plan: string) {
    super(`El plan ${plan} no se paga; elige «Cambiar a ${plan}» en Mi suscripción.`);
  }
}

/** Bajar de plan no se cobra: aplica al terminar la vigencia (programar descenso). */
export class CambioEsDescenso extends ErrorSuscripciones {
  readonly codigo = "es-descenso";

  constructor(readonly plan: string) {
    super(`Pasar a ${plan} es un descenso: aplica cuando termine tu vigencia actual.`);
  }
}

export class DescensoNoPermitido extends ErrorSuscripciones {
  readonly codigo = "descenso-no-permitido";
}
