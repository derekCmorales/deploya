import { randomUUID } from "node:crypto";
import type { NuevoTokenCuenta, TipoTokenCuenta, TokenCuenta } from "../dominio/cuenta";
import { RepositorioTokensCuenta } from "../puertos/repositorio-tokens-cuenta.puerto";

/** Mientras DB-01 no esté en `main`; el adaptador Prisma lo reemplaza en `identidad.module.ts`. */
export class RepositorioTokensCuentaMemoria extends RepositorioTokensCuenta {
  private readonly tokens = new Map<string, TokenCuenta>();

  async crear(token: NuevoTokenCuenta): Promise<TokenCuenta> {
    const creado = { ...token, id: randomUUID(), usadoEn: null };
    this.tokens.set(creado.id, creado);
    return creado;
  }

  async porHuella(hashToken: string): Promise<TokenCuenta | null> {
    return [...this.tokens.values()].find((t) => t.hashToken === hashToken) ?? null;
  }

  async marcarUsado(id: string, usadoEn: Date): Promise<void> {
    const token = this.tokens.get(id);
    if (token) this.tokens.set(id, { ...token, usadoEn });
  }

  async invalidarVigentes(usuarioId: string, tipo: TipoTokenCuenta, marca: Date): Promise<void> {
    for (const token of this.tokens.values()) {
      if (token.usuarioId === usuarioId && token.tipo === tipo && !token.usadoEn) this.tokens.set(token.id, { ...token, usadoEn: marca });
    }
  }

  async ultimoDe(usuarioId: string, tipo: TipoTokenCuenta): Promise<TokenCuenta | null> {
    const delUsuario = [...this.tokens.values()].filter((t) => t.usuarioId === usuarioId && t.tipo === tipo);
    return delUsuario.sort((a, b) => b.creado.getTime() - a.creado.getTime())[0] ?? null;
  }
}
