import { Module } from "@nestjs/common";
import { puerto } from "../../adapters/adapters.module";
import { Espera, EsperaTemporizador } from "../../compartido/espera";
import { configuracionEnrutamientoDesde } from "../enrutamiento/configuracion-enrutamiento";
import { EnrutamientoTrabajadorModule } from "../enrutamiento/enrutamiento-trabajador.module";
import { VariablesModule } from "../proyectos/variables.module";
import { ConexionesDatos } from "./conexiones-datos";
import { DOMINIO_DATOS } from "./datos.constantes";
import { ColaMedicionDiscoBullMq } from "./medicion/cola-medicion.bullmq";
import { ColaMedicionDiscoMemoria } from "./medicion/cola-medicion.memoria";
import { ColaMedicionDiscoPuerto } from "./medicion/cola-medicion.puerto";
import { TareaMedicionDisco } from "./medicion/tarea-medicion-disco";
import { MotorDatosService } from "./motor-datos.service";

/**
 * Recursos de datos en el trabajador: `MotorDatosService` consume la cola `datos`, lo usan la etapa de
 * Ejecución y el eliminar de M5, y mide el disco cada 5 min. `RecursosDatosPuerto` lo da `AdaptersModule`.
 */
@Module({
  imports: [VariablesModule, EnrutamientoTrabajadorModule],
  providers: [
    ConexionesDatos,
    { provide: DOMINIO_DATOS, useFactory: () => configuracionEnrutamientoDesde(process.env) },
    MotorDatosService,
    { provide: Espera, useClass: EsperaTemporizador },
    puerto(ColaMedicionDiscoPuerto, { docker: (c) => new ColaMedicionDiscoBullMq(c.redisUrl), stub: () => new ColaMedicionDiscoMemoria() }),
    TareaMedicionDisco,
  ],
  exports: [MotorDatosService],
})
export class DatosTrabajadorModule {}
