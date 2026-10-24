import { Module } from "@nestjs/common";
import { AvisosModule } from "../notificaciones/avisos/avisos.module";
import { EnrutamientoTrabajadorModule } from "../enrutamiento/enrutamiento-trabajador.module";
import { PasoEnrutamiento } from "../enrutamiento/paso-enrutamiento";
import { OrquestacionTrabajadorModule } from "../orquestacion/orquestacion-trabajador.module";
import { PasoEjecucion } from "../orquestacion/paso-ejecucion";
import { PasoOperacion } from "../orquestacion/paso-operacion";
import { AvisoDespliegueOyente } from "./avisos/aviso-despliegue.oyente";
import { PROVEEDORES_DETECCION } from "./deteccion/deteccion-stack.service";
import { PLANES_PIPELINE, type PlanesPipeline } from "./pipeline/paso-pipeline";
import { PasoConstruccion } from "./pipeline/paso-construccion";
import { PasoRecepcion } from "./pipeline/paso-recepcion";
import { PipelineDespliegue } from "./pipeline/pipeline-despliegue";
import { VigiaCancelacion } from "./pipeline/vigia-cancelacion";
import { CancelacionesPuerto } from "./puertos/cancelaciones.puerto";
import { OYENTES_DESPLIEGUE } from "./puertos/oyente-despliegue.puerto";
import { RetencionArtefactos } from "../orquestacion/retencion/retencion-artefactos";

/**
 * Arma los planes del pipeline: `construccion` (Recepción → Construcción → Ejecución → Enrutamiento → Operación)
 * y `reversion` (los tres últimos pasos, sobre la imagen de un artefacto).
 */
@Module({
  imports: [OrquestacionTrabajadorModule, EnrutamientoTrabajadorModule, AvisosModule],
  providers: [
    ...PROVEEDORES_DETECCION,
    PasoRecepcion,
    PasoConstruccion,
    AvisoDespliegueOyente,
    {
      provide: PLANES_PIPELINE,
      useFactory: (recepcion: PasoRecepcion, construccion: PasoConstruccion, ejecucion: PasoEjecucion, enrutamiento: PasoEnrutamiento, operacion: PasoOperacion): PlanesPipeline => ({
        construccion: [recepcion, construccion, ejecucion, enrutamiento, operacion],
        reversion: [ejecucion, enrutamiento, operacion],
      }),
      inject: [PasoRecepcion, PasoConstruccion, PasoEjecucion, PasoEnrutamiento, PasoOperacion],
    },
    {
      provide: OYENTES_DESPLIEGUE,
      useFactory: (...oyentes: unknown[]) => oyentes,
      inject: [RetencionArtefactos, AvisoDespliegueOyente],
    },
    { provide: VigiaCancelacion, useFactory: (cancelaciones: CancelacionesPuerto) => new VigiaCancelacion(cancelaciones), inject: [CancelacionesPuerto] },
    PipelineDespliegue,
  ],
  exports: [PipelineDespliegue],
})
export class ConstruccionTrabajadorModule {}
