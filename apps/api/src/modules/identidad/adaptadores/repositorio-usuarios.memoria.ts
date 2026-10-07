import { randomUUID } from "node:crypto";
import type { EstadoCuenta, NuevoUsuario, Usuario } from "../dominio/cuenta";
import { RepositorioUsuarios } from "../puertos/repositorio-usuarios.puerto";

/** Mientras DB-01 no esté en `main`; el adaptador Prisma lo reemplaza en `identidad.module.ts`. */
export class RepositorioUsuariosMemoria extends RepositorioUsuarios {
  private readonly usuarios = new Map<string, Usuario>();

  async porCorreo(correo: string): Promise<Usuario | null> {
    return [...this.usuarios.values()].find((u) => u.correo === correo) ?? null;
  }

  async porId(id: string): Promise<Usuario | null> {
    return this.usuarios.get(id) ?? null;
  }

  async crear(usuario: NuevoUsuario): Promise<Usuario> {
    const creado = { ...usuario, id: randomUUID() };
    this.usuarios.set(creado.id, creado);
    return creado;
  }

  async cambiarEstado(id: string, estado: EstadoCuenta): Promise<void> {
    const usuario = this.usuarios.get(id);
    if (usuario) this.usuarios.set(id, { ...usuario, estadoCuenta: estado });
  }

  async cambiarHash(id: string, hashContrasena: string): Promise<void> {
    const usuario = this.usuarios.get(id);
    if (usuario) this.usuarios.set(id, { ...usuario, hashContrasena });
  }
}
