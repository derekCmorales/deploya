/** El token viaja en el enlace; en la base solo queda su huella (como los tokens de M1). */
export abstract class TokensInvitacion {
  abstract generar(): string;
  abstract huella(token: string): string;
}
