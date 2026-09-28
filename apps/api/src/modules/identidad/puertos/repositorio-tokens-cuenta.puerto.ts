import type { NuevoTokenCuenta, TokenCuenta } from "../dominio/cuenta";

/** Repository de `TokenCuenta` (DB-01): se busca por la huella, nunca por el token en claro. */
export abstract class RepositorioTokensCuenta {
  abstract crear(token: NuevoTokenCuenta): Promise<TokenCuenta>;
  abstract porHuella(hashToken: string): Promise<TokenCuenta | null>;
  abstract marcarUsado(id: string, usadoEn: Date): Promise<void>;
}
