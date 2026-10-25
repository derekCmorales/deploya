import type { Invitacion, InvitacionActiva, NuevaInvitacion } from "../dominio/invitacion";

/** Repository de `Invitacion` (M9, SP-18). */
export abstract class RepositorioInvitaciones {
  abstract crear(nueva: NuevaInvitacion): Promise<Invitacion>;
  /** Sin usar, sin revocar y sin vencer, la que vence antes primero. */
  abstract activas(ahora: Date): Promise<InvitacionActiva[]>;
  abstract porId(id: string): Promise<Invitacion | null>;
  abstract porHash(hashToken: string): Promise<Invitacion | null>;
  abstract revocar(id: string, marca: Date): Promise<void>;
  /** Solo si sigue sin usar: dos registros con el mismo enlace no pasan los dos. */
  abstract marcarUsada(id: string, marca: Date): Promise<boolean>;
}
