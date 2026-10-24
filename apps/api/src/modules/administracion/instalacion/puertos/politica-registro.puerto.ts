/**
 * Lo que M1 pregunta al registrar (contrato instalacion.md, M1 ← M9). El registro no sabe del
 * modo ni de invitaciones. Errores: 403 `RegistroCerrado` · 403 `InvitacionRequerida` ·
 * 410 `InvitacionNoValida`.
 */
export abstract class PoliticaRegistroPuerto {
  /** Antes de crear la cuenta. */
  abstract exigirPermitido(correo: string, invitacion?: string): Promise<void>;
  /** Después de crearla: deja la invitación usada (un solo uso). */
  abstract consumir(correo: string, invitacion?: string): Promise<void>;
}
