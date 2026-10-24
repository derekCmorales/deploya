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

export class CuentaNoSuspendida extends ErrorAdministracion {
  readonly codigo = "CuentaNoSuspendida";

  constructor() {
    super("Solo se reactiva una cuenta suspendida.");
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

/** Admin · Instalación (SP-18) solo existe en autoalojado: en la nube, 404. */
export class InstalacionSoloAutoalojada extends ErrorAdministracion {
  readonly codigo = "InstalacionSoloAutoalojada";

  constructor() {
    super("Esta instalación de Deploya no es autoalojada.");
  }
}

export class AjusteInvalido extends ErrorAdministracion {
  readonly codigo = "AjusteInvalido";
}

export class InvitacionNoEncontrada extends ErrorAdministracion {
  readonly codigo = "InvitacionNoEncontrada";

  constructor() {
    super("No existe esa invitación.");
  }
}

/** Registro (01) con la política de la instalación: el código lo lee la web de Eddy. */
export class RegistroCerrado extends ErrorAdministracion {
  readonly codigo = "RegistroCerrado";

  constructor() {
    super("Esta instalación no admite cuentas nuevas. Pide acceso a quien la administra.");
  }
}

export class InvitacionRequerida extends ErrorAdministracion {
  readonly codigo = "InvitacionRequerida";

  constructor() {
    super("En esta instalación solo se entra con una invitación.");
  }
}

/** Vencida, usada, revocada, de otro correo o inexistente: el enlace ya no sirve (410). */
export class InvitacionNoValida extends ErrorAdministracion {
  readonly codigo = "InvitacionNoValida";

  constructor(readonly motivo: "vencida" | "usada" | "revocada" | "desconocida") {
    super("Este enlace de invitación ya no sirve. Pide uno nuevo.");
  }
}
