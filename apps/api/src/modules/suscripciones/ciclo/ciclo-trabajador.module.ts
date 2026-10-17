import { Module } from "@nestjs/common";
import { puerto } from "../../../adapters/adapters.module";
import { OrquestacionModule } from "../../orquestacion/orquestacion.module";
import { SuscripcionesModule } from "../suscripciones.module";
import { CicloSuscripcionService } from "./ciclo-suscripcion.service";
import { ColaCicloBullMq } from "./cola-ciclo.bullmq";
import { ColaCicloMemoria } from "./cola-ciclo.memoria";
import { ColaCicloPuerto } from "./cola-ciclo.puerto";
import { TareaCicloDiaria } from "./tarea-ciclo-diaria";

/** Ciclo §4.4 en el trabajador: la tarea diaria con BullMQ en modo `docker` y en memoria si no. */
@Module({
  imports: [SuscripcionesModule, OrquestacionModule],
  providers: [
    CicloSuscripcionService,
    puerto(ColaCicloPuerto, { docker: (c) => new ColaCicloBullMq(c.redisUrl), stub: () => new ColaCicloMemoria() }),
    TareaCicloDiaria,
  ],
})
export class CicloTrabajadorModule {}
