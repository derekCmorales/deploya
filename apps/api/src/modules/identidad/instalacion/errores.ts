/** Errores del asistente de primera configuración (31, SP-17). Los del código vienen de M2. */
export class DemasiadosIntentosCodigo extends Error {
  override readonly name = "DemasiadosIntentosCodigo";

  constructor(readonly segundos: number) {
    super(`Demasiados intentos con el código de configuración. Espera ${Math.ceil(segundos / 60)} min.`);
  }
}

export class DatosCorreoInvalidos extends Error {
  override readonly name = "DatosCorreoInvalidos";

  constructor(readonly campo: string) {
    super(`Revisa el campo «${campo}» del correo.`);
  }
}

/** El servidor SMTP rechazó el correo de prueba; `error` es lo que respondió. */
export class CorreoDePruebaRechazado extends Error {
  override readonly name = "CorreoDePruebaRechazado";

  constructor(readonly error: string) {
    super(error);
  }
}
