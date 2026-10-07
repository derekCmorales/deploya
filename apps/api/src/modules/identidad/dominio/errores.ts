/** Errores de dominio de M1; el controlador los traduce a HTTP en el borde. */
export class CorreoInvalido extends Error {
  constructor(readonly correo: string) {
    super("El correo no tiene un formato válido");
    this.name = "CorreoInvalido";
  }
}

export class ContrasenaDebil extends Error {
  constructor(readonly reglasIncumplidas: readonly string[]) {
    super(`La contraseña no cumple: ${reglasIncumplidas.join(", ")}`);
    this.name = "ContrasenaDebil";
  }
}

export class ContrasenasNoCoinciden extends Error {
  constructor() {
    super("Las contraseñas no coinciden");
    this.name = "ContrasenasNoCoinciden";
  }
}

/** Pantalla 01b: el alta se rechaza y se ofrece iniciar sesión o recuperar contraseña. */
export class CorreoYaRegistrado extends Error {
  constructor(readonly correo: string) {
    super("Este correo ya tiene una cuenta.");
    this.name = "CorreoYaRegistrado";
  }
}

/**
 * Pantalla 02 (c): el enlace no existe, caducó o ya se usó. Un solo error hacia fuera para
 * no revelar cuál de los tres fue; el motivo queda para el log y las pruebas.
 */
export class TokenNoValido extends Error {
  constructor(readonly motivo: "inexistente" | "expirado" | "usado") {
    super("El enlace ya no es válido");
    this.name = "TokenNoValido";
  }
}

/** Pantalla 03b: banner genérico; nunca se dice si falló el correo o la contraseña. */
export class CredencialesInvalidas extends Error {
  constructor() {
    super("Correo o contraseña incorrectos");
    this.name = "CredencialesInvalidas";
  }
}

/** Pantalla 03b: la cuenta existe y la clave es correcta, pero falta abrir el enlace. */
export class CuentaNoVerificada extends Error {
  constructor(readonly correoEnmascarado: string) {
    super("Tu cuenta aún no está verificada");
    this.name = "CuentaNoVerificada";
  }
}

/** Pantalla 03b: suspendida por administración (M9), con el motivo y la fecha que registró M9. */
export class CuentaSuspendida extends Error {
  constructor(
    readonly motivo: string | null = null,
    readonly desde: Date | null = null,
  ) {
    super("Cuenta suspendida por administración");
    this.name = "CuentaSuspendida";
  }
}
