import { InvitacionNoValida } from "../../dominio/errores";

/** Una invitación vale 7 días y una sola vez (contrato instalacion.md). */
export const DIAS_INVITACION = 7;
const DIA_MS = 24 * 60 * 60 * 1000;

export interface Invitacion {
  id: string;
  correo: string;
  hashToken: string;
  vence: Date;
  usada: Date | null;
  revocada: Date | null;
  creadaPor: string;
  creado: Date;
}

export type NuevaInvitacion = Omit<Invitacion, "id" | "usada" | "revocada">;

/** Lo que la 32 lista: «ana@miempresa.com · vence en 6 días». */
export interface InvitacionActiva {
  id: string;
  correo: string;
  vence: Date;
}

export function venceDe(creada: Date): Date {
  return new Date(creada.getTime() + DIAS_INVITACION * DIA_MS);
}

/** Correo normalizado, igual que M1 al registrar. */
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

/** Usable: no revocada, no usada, sin vencer y para el mismo correo. Si no, 410. */
export function exigirUsable(invitacion: Invitacion | null, correo: string, ahora: Date): Invitacion {
  if (!invitacion) throw new InvitacionNoValida("desconocida");
  if (invitacion.revocada) throw new InvitacionNoValida("revocada");
  if (invitacion.usada) throw new InvitacionNoValida("usada");
  if (invitacion.vence.getTime() <= ahora.getTime()) throw new InvitacionNoValida("vencida");
  if (invitacion.correo !== normalizarCorreo(correo)) throw new InvitacionNoValida("desconocida");
  return invitacion;
}
