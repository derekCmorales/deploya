import { Module } from "@nestjs/common";
import { puerto } from "../../adapters/adapters.module";
import { EnrutamientoTrabajadorModule } from "../enrutamiento/enrutamiento-trabajador.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { AccionesContenedorService } from "./acciones/acciones-contenedor.service";
import { DetenerManejador } from "./acciones/detener.manejador";
import { EliminarManejador } from "./acciones/eliminar.manejador";
import { MANEJADORES_ACCION } from "./acciones/manejador-accion";
import { ReiniciarManejador } from "./acciones/reiniciar.manejador";
import { CuotaPlanSuscripciones } from "./adaptadores/cuota-plan.suscripciones";
import { RetencionArtefactos } from "./retencion/retencion-artefactos";
import { OrquestacionService } from "./orquestacion.service";
import { PasoEjecucion } from "./paso-ejecucion";
import { PasoOperacion } from "./paso-operacion";
import { VariablesModule } from "../proyectos/variables.module";
import { VariablesEntornoProyecto } from "./adaptadores/variables-entorno.proyecto";
import { ColaMuestreoBullMq } from "./metricas/cola-muestreo.bullmq";
import { ColaMuestreoMemoria } from "./metricas/cola-muestreo.memoria";
import { ColaMuestreoPuerto } from "./metricas/cola-muestreo.puerto";
import { MuestreoMetricas } from "./metricas/muestreo-metricas";
import { TareaMuestreoMetricas } from "./metricas/tarea-muestreo";
import { CuotaPlanPuerto } from "./puertos/cuota-plan.puerto";
import { VariablesEntornoPuerto } from "./puertos/variables-entorno.puerto";

/**
 * Lo que M5 aporta al proceso trabajador: los pasos del pipeline (límites del plan de M2),
 * el consumidor de la cola `operacion` con un manejador por acción, la retención de artefactos
 * y el muestreo de CPU y memoria cada 60 s.
 */
@Module({
  imports: [SuscripcionesModule, EnrutamientoTrabajadorModule, VariablesModule],
  providers: [
    OrquestacionService,
    PasoEjecucion,
    PasoOperacion,
    RetencionArtefactos,
    { provide: CuotaPlanPuerto, useClass: CuotaPlanSuscripciones },
    { provide: VariablesEntornoPuerto, useClass: VariablesEntornoProyecto },
    ReiniciarManejador,
    DetenerManejador,
    EliminarManejador,
    {
      provide: MANEJADORES_ACCION,
      useFactory: (...manejadores: unknown[]) => manejadores,
      inject: [ReiniciarManejador, DetenerManejador, EliminarManejador],
    },
    AccionesContenedorService,
    MuestreoMetricas,
    puerto(ColaMuestreoPuerto, { docker: (c) => new ColaMuestreoBullMq(c.redisUrl), stub: () => new ColaMuestreoMemoria() }),
    TareaMuestreoMetricas,
  ],
  exports: [OrquestacionService, PasoEjecucion, PasoOperacion, RetencionArtefactos, AccionesContenedorService, MuestreoMetricas],
})
export class OrquestacionTrabajadorModule {}
