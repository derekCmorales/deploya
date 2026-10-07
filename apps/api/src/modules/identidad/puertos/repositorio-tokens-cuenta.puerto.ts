import type { NuevoTokenCuenta, TipoTokenCuenta, TokenCuenta } from "../dominio/cuenta";

/** Repository de `TokenCuenta` (DB-01): se busca por la huella, nunca por el token en claro. */
export abstract class RepositorioTokensCuenta {
  abstract crear(token: NuevoTokenCuenta): Promise<TokenCuenta>;
  abstract porHuella(hashToken: string): Promise<TokenCuenta | null>;
  abstract marcarUsado(id: string, usadoEn: Date): Promise<void>;
  /** Marca como usados los tokens sin usar de ese tipo: solo queda vivo el que se cree después. */
  abstract invalidarVigentes(usuarioId: string, tipo: TipoTokenCuenta, marca: Date): Promise<void>;
}
