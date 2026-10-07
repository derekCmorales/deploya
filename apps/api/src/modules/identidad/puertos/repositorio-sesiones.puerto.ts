import type { NuevaSesion, Sesion } from "../dominio/sesion";

/** Repository de `Sesion` (DB-01): se busca por la huella del valor de la cookie. */
export abstract class RepositorioSesiones {
  abstract crear(sesion: NuevaSesion): Promise<Sesion>;
  abstract porHuella(hashToken: string): Promise<Sesion | null>;
  abstract registrarActividad(id: string, marca: Date): Promise<void>;
  abstract revocar(id: string, marca: Date): Promise<void>;
  /** Cierra todas las sesiones abiertas de la cuenta (M1-05: tras restablecer la contraseña). */
  abstract revocarTodasDe(usuarioId: string, marca: Date): Promise<void>;
}
