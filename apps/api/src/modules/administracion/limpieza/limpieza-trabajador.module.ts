import { Module } from "@nestjs/common";
import { CONFIGURACION_MOTOR, type ConfiguracionMotor } from "../../../adapters/configuracion-motor";
import { RegistroLimpiezaPrisma } from "./adaptadores/registro-limpieza.prisma";
import { ColaLimpiezaBullMq } from "./cola-limpieza.bullmq";
import { ColaLimpiezaMemoria } from "./cola-limpieza.memoria";
import { ColaLimpiezaPuerto } from "./cola-limpieza.puerto";
import { LimpiezaService } from "./limpieza.service";
import { RegistroLimpiezaPuerto } from "./puertos/registro-limpieza.puerto";
import { TareaLimpiezaDiaria } from "./tarea-limpieza-diaria";

/** BullMQ con `MOTOR_ADAPTADORES=docker`; en memoria si no. Corre en la nube y en autoalojado. */
export function colaLimpiezaPara(motor: ConfiguracionMotor): ColaLimpiezaPuerto {
  return motor.modo === "docker" ? new ColaLimpiezaBullMq(motor.redisUrl) : new ColaLimpiezaMemoria();
}

/** Limpieza diaria en el trabajador (EST-01b). */
@Module({
  providers: [
    LimpiezaService,
    { provide: RegistroLimpiezaPuerto, useClass: RegistroLimpiezaPrisma },
    { provide: ColaLimpiezaPuerto, useFactory: colaLimpiezaPara, inject: [CONFIGURACION_MOTOR] },
    TareaLimpiezaDiaria,
  ],
})
export class LimpiezaTrabajadorModule {}
