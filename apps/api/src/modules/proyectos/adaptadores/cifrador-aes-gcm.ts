import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { VariableIlegible } from "../dominio/errores";
import { PREFIJO_CIFRADO } from "../dominio/variable";
import { CifradorVariables } from "../puertos/cifrador-variables.puerto";
import { CifradorFalso } from "./cifrador-falso";

const ALGORITMO = "aes-256-gcm";
const BYTES_CLAVE = 32;
const BYTES_IV = 12;

/** AES-256-GCM. Formato `v1:<iv>:<tag>:<cifrado>` en base64. La clave llega por constructor. */
export class CifradorAesGcm extends CifradorVariables {
  private readonly clave: Buffer;

  constructor(claveUtf8: string) {
    super();
    const clave = Buffer.from(claveUtf8, "utf8");
    if (clave.length !== BYTES_CLAVE) throw new Error(`CLAVE_CIFRADO_VARIABLES debe tener ${BYTES_CLAVE} bytes.`);
    this.clave = clave;
  }

  cifrar(valor: string): string {
    const iv = randomBytes(BYTES_IV);
    const cifrador = createCipheriv(ALGORITMO, this.clave, iv);
    const cifrado = Buffer.concat([cifrador.update(valor, "utf8"), cifrador.final()]);
    return armar(iv, cifrador.getAuthTag(), cifrado);
  }

  descifrar(valorCifrado: string): string {
    try {
      const { iv, etiqueta, cifrado } = partesDe(valorCifrado);
      const descifrador = createDecipheriv(ALGORITMO, this.clave, iv);
      descifrador.setAuthTag(etiqueta);
      return Buffer.concat([descifrador.update(cifrado), descifrador.final()]).toString("utf8");
    } catch (error) {
      if (error instanceof VariableIlegible) throw error;
      throw new VariableIlegible();
    }
  }
}

export function cifradorDesdeEntorno(env: NodeJS.ProcessEnv): CifradorVariables {
  const clave = env.CLAVE_CIFRADO_VARIABLES ?? "";
  if (Buffer.byteLength(clave) === BYTES_CLAVE) return new CifradorAesGcm(clave);
  if (env.NODE_ENV === "production") throw new Error("CLAVE_CIFRADO_VARIABLES debe tener 32 bytes.");
  return new CifradorFalso();
}

function armar(iv: Buffer, etiqueta: Buffer, cifrado: Buffer): string {
  return [PREFIJO_CIFRADO, iv.toString("base64"), etiqueta.toString("base64"), cifrado.toString("base64")].join(":");
}

function partesDe(valor: string): { iv: Buffer; etiqueta: Buffer; cifrado: Buffer } {
  const partes = valor.split(":");
  if (partes.length !== 4 || partes[0] !== PREFIJO_CIFRADO) throw new VariableIlegible();
  return {
    iv: Buffer.from(partes[1], "base64"),
    etiqueta: Buffer.from(partes[2], "base64"),
    cifrado: Buffer.from(partes[3], "base64"),
  };
}
