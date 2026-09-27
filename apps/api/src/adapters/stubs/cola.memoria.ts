import { Injectable } from "@nestjs/common";
import type { TrabajoDespliegue } from "../../modules/construccion/dominio/despliegue";
import { ColaConstruccionPuerto } from "../../modules/construccion/puertos/cola-construccion.puerto";

/** Cola en memoria: guarda los trabajos para que las pruebas los inspeccionen. */
@Injectable()
export class ColaMemoria extends ColaConstruccionPuerto {
  readonly trabajos: TrabajoDespliegue[] = [];

  async encolar(trabajo: TrabajoDespliegue): Promise<void> {
    if (this.trabajos.some((t) => t.despliegueId === trabajo.despliegueId)) return;
    this.trabajos.push(trabajo);
  }
}
