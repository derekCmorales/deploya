import { ColaLimpiezaPuerto } from "./cola-limpieza.puerto";

/** Cola en memoria: guarda el manejador para que la prueba dispare la corrida a mano. */
export class ColaLimpiezaMemoria extends ColaLimpiezaPuerto {
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
    if (!this.manejador) throw new Error("La limpieza diaria no está programada");
    return this.manejador();
  }
}
