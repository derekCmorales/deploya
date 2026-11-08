import type { UltimaLimpieza } from "../dominio/politica-limpieza";

/** Cuándo corrió la limpieza y cuántas filas borró (columnas de `ConfiguracionInstalacion`). */
export abstract class RegistroLimpiezaPuerto {
  /** Crea la fila única si no existe. */
  abstract guardar(limpieza: UltimaLimpieza): Promise<void>;
  /** `null` si todavía no corrió nunca. */
  abstract ultima(): Promise<UltimaLimpieza | null>;
}
