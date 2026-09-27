import { Module } from "@nestjs/common";
import { EnrutamientoTrabajadorModule } from "../enrutamiento/enrutamiento-trabajador.module";
import { PasoEnrutamiento } from "../enrutamiento/paso-enrutamiento";
import { OrquestacionTrabajadorModule } from "../orquestacion/orquestacion-trabajador.module";
import { PasoEjecucion } from "../orquestacion/paso-ejecucion";
import { PasoOperacion } from "../orquestacion/paso-operacion";
import { PASOS_CONSTRUCCION } from "./pipeline/paso-pipeline";
import { PasoConstruccion } from "./pipeline/paso-construccion";
import { PasoRecepcion } from "./pipeline/paso-recepcion";
import { PipelineDespliegue } from "./pipeline/pipeline-despliegue";

/** Arma el plan `construccion`: Recepción → Construcción → Ejecución → Enrutamiento → Operación. */
@Module({
  imports: [OrquestacionTrabajadorModule, EnrutamientoTrabajadorModule],
  providers: [
    PasoRecepcion,
    PasoConstruccion,
    {
      provide: PASOS_CONSTRUCCION,
      useFactory: (...pasos: unknown[]) => pasos,
      inject: [PasoRecepcion, PasoConstruccion, PasoEjecucion, PasoEnrutamiento, PasoOperacion],
    },
    PipelineDespliegue,
  ],
  exports: [PipelineDespliegue],
})
export class ConstruccionTrabajadorModule {}
