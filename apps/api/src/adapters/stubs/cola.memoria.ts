import { Injectable } from "@nestjs/common";
import type { TrabajoDespliegue } from "../../modules/construccion/dominio/despliegue";
import { ColaConstruccionPuerto } from "../../modules/construccion/puertos/cola-construccion.puerto";

/** Cola en memoria: guarda los trabajos para que las pruebas los inspeccionen. */
@Injectable()
export class ColaMemoria extends ColaConstruccionPuerto {
  readonly trabajos: TrabajoDespliegue[] = [];
  readonly tomados: TrabajoDespliegue[] = [];

  async encolar(trabajo: TrabajoDespliegue): Promise<void> {
    if (this.trabajos.some((t) => t.despliegueId === trabajo.despliegueId)) return;
    this.trabajos.push(trabajo);
  }

  /** El trabajador tomó el trabajo: ya no espera en la cola y `quitar` no puede sacarlo (como en BullMQ). */
  tomar(despliegueId: string): void {
    const posicion = this.trabajos.findIndex((t) => t.despliegueId === despliegueId);
    if (posicion >= 0) this.tomados.push(...this.trabajos.splice(posicion, 1));
  }

  async quitar(despliegueId: string): Promise<boolean> {
    const posicion = this.trabajos.findIndex((t) => t.despliegueId === despliegueId);
    if (posicion < 0) return false;
    this.trabajos.splice(posicion, 1);
    return true;
  }
}
