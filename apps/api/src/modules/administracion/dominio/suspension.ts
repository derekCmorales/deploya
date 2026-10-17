import { CuentaYaSuspendida, DetalleInvalido, MotivoInvalido, NoSePuedeSuspenderAdministrador } from "./errores";

/** La única acción administrativa del núcleo (datos-nucleo.md). */
export const ACCION_SUSPENDER_CUENTA = "suspender-cuenta";
export const DETALLE_MAXIMO = 500;

/**
 * Motivos fijos de 25b: la clave viaja en la API y el texto es lo que ve el usuario en 03b
 * (`Usuario.motivoSuspension`).
 */
export const MOTIVOS_SUSPENSION = {
  terminos: "Uso que incumple los términos de servicio (§7.2).",
  "abuso-recursos": "Uso abusivo de recursos de la plataforma.",
  "contenido-malicioso": "Publicación de contenido malicioso o ilícito.",
  "pago-fraudulento": "Pago fraudulento o desconocido por el titular.",
  "solicitud-titular": "Suspensión solicitada por el titular de la cuenta.",
} as const;

export type MotivoSuspension = keyof typeof MOTIVOS_SUSPENSION;

/** Lo que M9 sabe de la cuenta a suspender. */
export interface CuentaObjetivo {
  id: string;
  rol: "cliente" | "administrador";
  estadoCuenta: "pendiente" | "activa" | "suspendida";
}

export interface SolicitudSuspension {
  motivo: MotivoSuspension;
  detalle: string | null;
}

/** Lo que se escribe en una sola transacción (Unit of Work). */
export interface Suspension {
  adminId: string;
  usuarioId: string;
  motivo: MotivoSuspension;
  textoMotivo: string;
  detalle: string | null;
  marca: Date;
}

function esMotivo(valor: unknown): valor is MotivoSuspension {
  return typeof valor === "string" && Object.hasOwn(MOTIVOS_SUSPENSION, valor);
}

/** Cuerpo de `POST /admin/usuarios/:id/suspension`: motivo de la lista y detalle opcional (≤ 500). */
export function validarSolicitudSuspension(cuerpo: unknown): SolicitudSuspension {
  const { motivo, detalle } = (cuerpo ?? {}) as Record<string, unknown>;
  if (!esMotivo(motivo)) throw new MotivoInvalido();
  if (detalle !== undefined && detalle !== null && typeof detalle !== "string") {
    throw new DetalleInvalido("El detalle debe ser texto.");
  }
  const texto = typeof detalle === "string" ? detalle.trim() : "";
  if (texto.length > DETALLE_MAXIMO) throw new DetalleInvalido(`El detalle admite hasta ${DETALLE_MAXIMO} caracteres.`);
  return { motivo, detalle: texto || null };
}

/** Reglas de M9-02: no se suspende a un administrador ni dos veces la misma cuenta. */
export function exigirSuspendible(cuenta: CuentaObjetivo): void {
  if (cuenta.rol === "administrador") throw new NoSePuedeSuspenderAdministrador();
  if (cuenta.estadoCuenta === "suspendida") throw new CuentaYaSuspendida();
}
