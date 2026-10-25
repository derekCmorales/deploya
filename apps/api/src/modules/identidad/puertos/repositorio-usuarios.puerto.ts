import type { EstadoCuenta, NuevoUsuario, Usuario } from "../dominio/cuenta";

/** Repository de `Usuario` (DB-01). Hasta que el schema entre a `main`, vive en memoria. */
export abstract class RepositorioUsuarios {
  abstract porCorreo(correo: string): Promise<Usuario | null>;
  abstract porId(id: string): Promise<Usuario | null>;
  abstract crear(usuario: NuevoUsuario): Promise<Usuario>;
  abstract cambiarEstado(id: string, estado: EstadoCuenta): Promise<void>;
  /** Guarda el hash nuevo y la fecha del cambio en una sola escritura (SP-03). */
  abstract cambiarHash(id: string, hashContrasena: string, cambiadaEn: Date): Promise<void>;
  abstract cambiarNombre(id: string, nombre: string): Promise<void>;
}
