import { Injectable } from "@nestjs/common";
import { CancelacionesPuerto } from "../../modules/construccion/puertos/cancelaciones.puerto";

/** Cancelaciones en memoria: la misma semántica que Redis sin TTL (las pruebas no esperan 10 minutos). */
@Injectable()
export class CancelacionesMemoria extends CancelacionesPuerto {
  private readonly pedidas = new Set<string>();

  async pedir(despliegueId: string): Promise<void> {
    this.pedidas.add(despliegueId);
  }

  async pedida(despliegueId: string): Promise<boolean> {
    return this.pedidas.has(despliegueId);
  }
}
