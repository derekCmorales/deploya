import { Injectable } from "@nestjs/common";
import { RepositorioUsuarios } from "./puertos/repositorio-usuarios.puerto";

export interface ContactoCuenta {
  correo: string;
  nombre: string;
}

/**
 * Lo único que otros módulos leen de una cuenta para escribirle (avisos de M10). Exportado
 * por `IdentidadModule`: nadie más lee `Usuario` directo (regla 1 de datos-nucleo.md).
 */
@Injectable()
export class DirectorioCuentas {
  constructor(private readonly usuarios: RepositorioUsuarios) {}

  async contactoDe(usuarioId: string): Promise<ContactoCuenta | null> {
    const usuario = await this.usuarios.porId(usuarioId);
    return usuario ? { correo: usuario.correo, nombre: usuario.nombre } : null;
  }
}
