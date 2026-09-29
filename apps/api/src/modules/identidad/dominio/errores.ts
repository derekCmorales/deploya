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
