/**
 * Errores de dominio de M9. El `codigo` es el que lee la web (25 y 25b);
 * `ErroresAdministracionFilter` los traduce a HTTP.
 */
export abstract class ErrorAdministracion extends Error {
  abstract readonly codigo: string;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class UsuarioNoEncontrado extends ErrorAdministracion {
  readonly codigo = "UsuarioNoEncontrado";

  constructor(readonly usuarioId: string) {
    super(`No existe la cuenta ${usuarioId}`);
  }
}

export class NoSePuedeSuspenderAdministrador extends ErrorAdministracion {
  readonly codigo = "NoSePuedeSuspenderAdministrador";

  constructor() {
    super("Una cuenta de administración no se puede suspender desde el panel.");
  }
}

export class CuentaYaSuspendida extends ErrorAdministracion {
  readonly codigo = "CuentaYaSuspendida";

  constructor() {
    super("La cuenta ya está suspendida.");
  }
}

export class MotivoInvalido extends ErrorAdministracion {
  readonly codigo = "MotivoInvalido";

  constructor() {
    super("Elige un motivo de la lista.");
  }
}

export class DetalleInvalido extends ErrorAdministracion {
  readonly codigo = "DetalleInvalido";
}

export class ConsultaInvalida extends ErrorAdministracion {
  readonly codigo = "ConsultaInvalida";
}
