import { Injectable } from "@nestjs/common";
import { SuscripcionesService } from "../../suscripciones/suscripciones.service";
import { CuotaDatosPuerto, type CuotaDatos } from "../puertos/cuota-datos.puerto";

/** Adapter sobre `cuotaDe` de M2: estado de la suscripción y límites de datos del plan. */
@Injectable()
export class CuotaDatosSuscripciones extends CuotaDatosPuerto {
  constructor(private readonly suscripciones: SuscripcionesService) {
    super();
  }

  async deUsuario(usuarioId: string): Promise<CuotaDatos> {
    const { estado, maxRecursosDatos, discoDatosMb } = await this.suscripciones.cuotaDe(usuarioId);
    return { estado, maxRecursosDatos, discoDatosMb };
  }
}
