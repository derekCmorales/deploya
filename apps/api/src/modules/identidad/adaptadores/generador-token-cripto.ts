import { createHash, randomBytes } from "node:crypto";
import { GeneradorToken } from "../puertos/generador-token.puerto";

const BYTES_TOKEN = 32;

/** 256 bits aleatorios en base64url; la huella es su sha256 en hex (lo que guarda `TokenCuenta`). */
export class GeneradorTokenCripto extends GeneradorToken {
  generar(): string {
    return randomBytes(BYTES_TOKEN).toString("base64url");
  }

  huella(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
