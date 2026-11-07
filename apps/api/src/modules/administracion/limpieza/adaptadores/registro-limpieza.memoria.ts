import type { UltimaLimpieza } from "../dominio/politica-limpieza";
import { RegistroLimpiezaPuerto } from "../puertos/registro-limpieza.puerto";

/** Doble en memoria: la misma fila única que en la base. */
export class RegistroLimpiezaMemoria extends RegistroLimpiezaPuerto {
  guardada: UltimaLimpieza | null = null;

  async guardar(limpieza: UltimaLimpieza): Promise<void> {
    this.guardada = { ...limpieza };
  }

  async ultima(): Promise<UltimaLimpieza | null> {
    return this.guardada;
  }
}
