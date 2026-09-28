/**
 * Tokens de enlace (verificación y, en A2, recuperación). El valor viaja en el correo;
 * en la base solo queda su huella.
 */
export abstract class GeneradorToken {
  abstract generar(): string;
  abstract huella(token: string): string;
}
