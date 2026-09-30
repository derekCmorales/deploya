import type { CambioSuscripcion, NuevaSuscripcion, Suscripcion } from "../dominio/suscripcion";

export abstract class RepositorioSuscripciones {
  abstract deUsuario(usuarioId: string): Promise<Suscripcion | null>;
  /** Idempotente: si la cuenta ya tiene suscripción, no la toca (invariante I1). */
  abstract crearSiNoExiste(nueva: NuevaSuscripcion): Promise<void>;
  /** Plan, estado y vigencia tras un pago aprobado. */
  abstract actualizar(suscripcionId: string, cambio: CambioSuscripcion): Promise<Suscripcion>;
  /** Descenso pendiente: no cambia plan, estado ni vigencia. */
  abstract programarDescenso(suscripcionId: string, planSiguienteId: string): Promise<Suscripcion>;
}
