import type { CuentaObjetivo, Suspension } from "../dominio/suspension";

/** Escritura de M9-02 (Unit of Work): cuenta, sesiones y acción administrativa en una transacción. */
export abstract class CuentasSuspensionPuerto {
  abstract cuenta(usuarioId: string): Promise<CuentaObjetivo | null>;
  abstract suspender(suspension: Suspension): Promise<void>;
}
