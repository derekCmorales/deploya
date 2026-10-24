import { Module } from "@nestjs/common";
import { CONFIGURACION_MOTOR, type ConfiguracionMotor } from "../../../adapters/configuracion-motor";
import { AvisosModule } from "../../notificaciones/avisos/avisos.module";
import { OrquestacionModule } from "../../orquestacion/orquestacion.module";
import { MODO_INSTALACION, type ModoInstalacion } from "../modo/modo-instalacion";
import { SuscripcionesModule } from "../suscripciones.module";
import { CicloSuscripcionService } from "./ciclo-suscripcion.service";
import { ColaCicloApagada } from "./cola-ciclo.apagada";
import { ColaCicloBullMq } from "./cola-ciclo.bullmq";
import { ColaCicloMemoria } from "./cola-ciclo.memoria";
import { ColaCicloPuerto } from "./cola-ciclo.puerto";
import { TareaCicloDiaria } from "./tarea-ciclo-diaria";

/**
 * Strategy por modo de instalación (SP-06): en la nube la tarea diaria corre con BullMQ en modo
 * `docker` y en memoria si no; en autoalojado no se programa (no hay vencimientos).
 */
export const COLA_POR_MODO: Record<ModoInstalacion, (motor: ConfiguracionMotor) => ColaCicloPuerto> = {
  nube: (motor) => (motor.modo === "docker" ? new ColaCicloBullMq(motor.redisUrl) : new ColaCicloMemoria()),
  autoalojado: () => new ColaCicloApagada(),
};

/** Ciclo §4.4 en el trabajador. */
@Module({
  imports: [SuscripcionesModule, OrquestacionModule, AvisosModule],
  providers: [
    CicloSuscripcionService,
    {
      provide: ColaCicloPuerto,
      useFactory: (motor: ConfiguracionMotor, modo: ModoInstalacion) => COLA_POR_MODO[modo](motor),
      inject: [CONFIGURACION_MOTOR, MODO_INSTALACION],
    },
    TareaCicloDiaria,
  ],
})
export class CicloTrabajadorModule {}
