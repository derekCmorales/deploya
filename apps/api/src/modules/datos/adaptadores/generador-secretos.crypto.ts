import { randomInt } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { GeneradorSecretos } from "../puertos/generador-secretos.puerto";

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** `randomInt` es criptográficamente seguro y uniforme (sin el sesgo de `byte % 62`). */
@Injectable()
export class GeneradorSecretosCrypto extends GeneradorSecretos {
  contrasena(largo: number): string {
    return Array.from({ length: largo }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  }
}
