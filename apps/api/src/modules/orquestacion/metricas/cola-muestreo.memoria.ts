import { ColaMuestreoPuerto } from "./cola-muestreo.puerto";

/** Guarda el manejador para que la prueba dispare el tick a mano. */
export class ColaMuestreoMemoria extends ColaMuestreoPuerto {
  private manejador: (() => Promise<unknown>) | null = null;

  async iniciar(manejador: () => Promise<unknown>): Promise<void> {
    this.manejador = manejador;
  }

  async cerrar(): Promise<void> {
    this.manejador = null;
  }

  get programada(): boolean {
    return this.manejador !== null;
  }

  async correr(): Promise<unknown> {
    if (!this.manejador) throw new Error("La tarea de muestreo no está programada");
    return this.manejador();
  }
}
