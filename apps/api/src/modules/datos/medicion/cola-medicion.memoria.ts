import { ColaMedicionDiscoPuerto } from "./cola-medicion.puerto";

/** Guarda el manejador para que la prueba dispare el tick a mano. */
export class ColaMedicionDiscoMemoria extends ColaMedicionDiscoPuerto {
  private manejador: (() => Promise<unknown>) | null = null;

  async iniciar(manejador: () => Promise<unknown>): Promise<void> {
    this.manejador = manejador;
  }

  async cerrar(): Promise<void> {
    this.manejador = null;
  }

  async correr(): Promise<unknown> {
    return this.manejador?.();
  }
}
