import type { Reactivacion } from "../dominio/reactivacion";
import type { CuentaObjetivo, Suspension } from "../dominio/suspension";

/**
 * Escritura de M9-02 y SP-05 (Unit of Work): cuenta, sesiones y acción administrativa en una
 * transacción.
 */
export abstract class CuentasSuspensionPuerto {
  abstract cuenta(usuarioId: string): Promise<CuentaObjetivo | null>;
  abstract suspender(suspension: Suspension): Promise<void>;
  /** Suspendida → Activa, sin motivo, y la acción `reactivar-cuenta`. */
  abstract reactivar(reactivacion: Reactivacion): Promise<void>;
}
