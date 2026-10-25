import { createHash, randomBytes } from "node:crypto";
import { TokensInvitacion } from "../puertos/tokens-invitacion.puerto";

const BYTES_TOKEN = 32;

/** 256 bits en base64url; la huella es su sha256 en hex (lo que guarda `Invitacion.hashToken`). */
export class TokensInvitacionCripto extends TokensInvitacion {
  generar(): string {
    return randomBytes(BYTES_TOKEN).toString("base64url");
  }

  huella(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
