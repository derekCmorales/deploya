<<<<<<< HEAD
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
=======
import { CuotaProyectosPuerto, type CuotaProyectos } from "../puertos/cuota-proyectos.puerto";

/** Sandbox según docs/alcance.md § Planes y recursos v4.1. */
export const CUOTA_SANDBOX: CuotaProyectos = { plan: "Sandbox", maxProyectos: 1, cpus: 0.25, memoriaMb: 256 };

/** Hasta que M2 exporte `cuotaDe` (DB-01), todos los usuarios quedan en Sandbox. */
export class CuotaProyectosStub extends CuotaProyectosPuerto {
  async cuotaDe(): Promise<CuotaProyectos> {
    return CUOTA_SANDBOX;
  }
}
>>>>>>> origin/main
