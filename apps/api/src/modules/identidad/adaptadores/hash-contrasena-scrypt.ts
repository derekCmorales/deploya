import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from "node:crypto";
import { HashContrasena } from "../puertos/hash-contrasena.puerto";

const BYTES_SAL = 16;
const BYTES_CLAVE = 64;
const PREFIJO = "scrypt";

function derivar(clave: BinaryLike, sal: Buffer): Promise<Buffer> {
  return new Promise((resolver, rechazar) =>
    scrypt(clave, sal, BYTES_CLAVE, (error, derivada) => (error ? rechazar(error) : resolver(derivada))),
  );
}

/** Adapter con `scrypt` de Node (sin dependencias nativas). Formato: `scrypt:<sal>:<hash>` en hex. */
export class HashContrasenaScrypt extends HashContrasena {
  async calcular(clave: string): Promise<string> {
    const sal = randomBytes(BYTES_SAL);
    const derivada = await derivar(clave, sal);
    return `${PREFIJO}:${sal.toString("hex")}:${derivada.toString("hex")}`;
  }

  async coincide(clave: string, hash: string): Promise<boolean> {
    const [prefijo, salHex, hashHex] = hash.split(":");
    if (prefijo !== PREFIJO || !salHex || !hashHex) return false;
    const esperado = Buffer.from(hashHex, "hex");
    const derivada = await derivar(clave, Buffer.from(salHex, "hex"));
    return derivada.length === esperado.length && timingSafeEqual(derivada, esperado);
  }
}
