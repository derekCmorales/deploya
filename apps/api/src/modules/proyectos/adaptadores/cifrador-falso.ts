import { VariableIlegible } from "../dominio/errores";
import { PREFIJO_CIFRADO } from "../dominio/variable";
import { CifradorVariables } from "../puertos/cifrador-variables.puerto";

/** Doble reversible: mismo contrato que AES, sin `node:crypto`. El valor no queda en claro. */
export class CifradorFalso extends CifradorVariables {
  cifrar(valor: string): string {
    return `${PREFIJO_CIFRADO}:falso:falso:${Buffer.from(valor, "utf8").toString("base64")}`;
  }

  descifrar(valorCifrado: string): string {
    const partes = valorCifrado.split(":");
    if (partes.length !== 4 || partes[0] !== PREFIJO_CIFRADO || partes[1] !== "falso") throw new VariableIlegible();
    return Buffer.from(partes[3], "base64").toString("utf8");
  }
}
