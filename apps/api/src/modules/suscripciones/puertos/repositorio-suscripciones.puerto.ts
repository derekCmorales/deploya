import type { NuevaSuscripcion, Suscripcion } from "../dominio/suscripcion";

export abstract class RepositorioSuscripciones {
  abstract deUsuario(usuarioId: string): Promise<Suscripcion | null>;
  /** Idempotente: si la cuenta ya tiene suscripción, no la toca (invariante I1). */
  abstract crearSiNoExiste(nueva: NuevaSuscripcion): Promise<void>;
}
