import { randomBytes, scrypt } from "node:crypto";

const BYTES_SAL = 16;
const BYTES_CLAVE = 64;
const PREFIJO = "scrypt";

/**
 * Mismo formato que `HashContrasenaScrypt` de M1 (`scrypt:<sal>:<hash>` en hex), para que el
 * login de Eddy acepte las cuentas del seed. Cuando M1 esté en `main`, se reemplaza por
 * `new HashContrasenaScrypt().calcular`.
 */
export function hashSemilla(clave: string): Promise<string> {
  const sal = randomBytes(BYTES_SAL);
  return new Promise((resolver, rechazar) =>
    scrypt(clave, sal, BYTES_CLAVE, (error, derivada) =>
      error ? rechazar(error) : resolver(`${PREFIJO}:${sal.toString("hex")}:${derivada.toString("hex")}`),
    ),
  );
}
