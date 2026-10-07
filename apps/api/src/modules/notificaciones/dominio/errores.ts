/** Todos los adaptadores de `CorreoPuerto` lanzan este error cuando no logran entregar (LSP). */
export class CorreoNoEnviado extends Error {
  constructor(
    readonly destinatario: string,
    readonly causa: string,
  ) {
    super(`No se pudo enviar el correo a ${destinatario}: ${causa}`);
    this.name = "CorreoNoEnviado";
  }
}
