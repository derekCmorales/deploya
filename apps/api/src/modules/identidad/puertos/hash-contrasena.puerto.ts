/** La contraseña nunca se guarda en claro: solo su hash, calculado por este puerto. */
export abstract class HashContrasena {
  abstract calcular(clave: string): Promise<string>;
  abstract coincide(clave: string, hash: string): Promise<boolean>;
}
