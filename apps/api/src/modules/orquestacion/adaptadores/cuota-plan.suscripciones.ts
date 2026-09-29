import { Injectable } from "@nestjs/common";
import { SuscripcionesService } from "../../suscripciones/suscripciones.service";
import { CuotaPlanPuerto, type RecursosPlan } from "../puertos/cuota-plan.puerto";

/** Adapter sobre `cuotaDe` de M2: el contenedor corre con los `--cpus` y `--memory` del plan. */
@Injectable()
export class CuotaPlanSuscripciones extends CuotaPlanPuerto {
  constructor(private readonly suscripciones: SuscripcionesService) {
    super();
  }

  async recursosDe(usuarioId: string): Promise<RecursosPlan> {
    const cuota = await this.suscripciones.cuotaDe(usuarioId);
    return { plan: cuota.plan.codigo, cpus: cuota.cpus, memoriaMb: cuota.memoriaMb };
  }
}
