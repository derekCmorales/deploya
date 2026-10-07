import { Injectable } from "@nestjs/common";
import type { AccionContenedor } from "../../modules/orquestacion/dominio/accion-contenedor";
import { ColaOperacionPuerto } from "../../modules/orquestacion/puertos/cola-operacion.puerto";

/** Cola de operación en memoria: guarda las acciones en orden para que las pruebas las inspeccionen. */
@Injectable()
export class ColaOperacionMemoria extends ColaOperacionPuerto {
  readonly acciones: AccionContenedor[] = [];

  async encolar(accion: AccionContenedor): Promise<void> {
    this.acciones.push(accion);
  }
}
