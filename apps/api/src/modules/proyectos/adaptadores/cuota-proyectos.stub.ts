import { Injectable } from "@nestjs/common";
import { CuotaProyectosPuerto } from "../puertos/cuota-proyectos.puerto";

const MAX_PROYECTOS_SANDBOX = 1;

@Injectable()
export class CuotaProyectosStub extends CuotaProyectosPuerto {
  async maxProyectosDe(usuarioId: string): Promise<number> {
    if (usuarioId) {
      return MAX_PROYECTOS_SANDBOX;
    }
    return MAX_PROYECTOS_SANDBOX;
  }
}