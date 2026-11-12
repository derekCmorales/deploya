import { Injectable } from "@nestjs/common";
import type { ComandoDatos } from "../../modules/datos/dominio/comando-datos";
import { ColaDatosPuerto } from "../../modules/datos/puertos/cola-datos.puerto";

/** Cola `datos` en memoria: guarda los comandos en orden para que las pruebas los inspeccionen o los ejecuten. */
@Injectable()
export class ColaDatosMemoria extends ColaDatosPuerto {
  readonly comandos: ComandoDatos[] = [];

  async encolar(comando: ComandoDatos): Promise<void> {
    this.comandos.push(comando);
  }
}
