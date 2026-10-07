import { Injectable } from "@nestjs/common";
import { SuscripcionesService } from "../../suscripciones/suscripciones.service";
import { CuotaProyectosPuerto, type CuotaProyectos } from "../puertos/cuota-proyectos.puerto";

/** Adapter sobre la Facade de M2: M3 solo ve el límite de proyectos y los recursos. */
@Injectable()
export class CuotaProyectosSuscripciones extends CuotaProyectosPuerto {
  constructor(private readonly suscripciones: SuscripcionesService) {
    super();
  }

  async cuotaDe(usuarioId: string): Promise<CuotaProyectos> {
    const cuota = await this.suscripciones.cuotaDe(usuarioId);
    return { plan: cuota.plan.nombre, maxProyectos: cuota.maxProyectos, cpus: cuota.cpus, memoriaMb: cuota.memoriaMb };
  }
}
