import { Module } from "@nestjs/common";
import { EnrutamientoTrabajadorModule } from "../enrutamiento/enrutamiento-trabajador.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { AccionesContenedorService } from "./acciones/acciones-contenedor.service";
import { DetenerManejador } from "./acciones/detener.manejador";
import { EliminarManejador } from "./acciones/eliminar.manejador";
import { MANEJADORES_ACCION } from "./acciones/manejador-accion";
import { ReiniciarManejador } from "./acciones/reiniciar.manejador";
import { CuotaPlanSuscripciones } from "./adaptadores/cuota-plan.suscripciones";
import { OrquestacionService } from "./orquestacion.service";
import { PasoEjecucion } from "./paso-ejecucion";
import { PasoOperacion } from "./paso-operacion";
import { CuotaPlanPuerto } from "./puertos/cuota-plan.puerto";

/**
 * Lo que M5 aporta al proceso trabajador: los pasos del pipeline (límites del plan de M2) y
 * el consumidor de la cola `operacion` con un manejador por acción.
 */
@Module({
  imports: [SuscripcionesModule, EnrutamientoTrabajadorModule],
  providers: [
    OrquestacionService,
    PasoEjecucion,
    PasoOperacion,
    { provide: CuotaPlanPuerto, useClass: CuotaPlanSuscripciones },
    ReiniciarManejador,
    DetenerManejador,
    EliminarManejador,
    {
      provide: MANEJADORES_ACCION,
      useFactory: (...manejadores: unknown[]) => manejadores,
      inject: [ReiniciarManejador, DetenerManejador, EliminarManejador],
    },
    AccionesContenedorService,
  ],
  exports: [OrquestacionService, PasoEjecucion, PasoOperacion, AccionesContenedorService],
})
export class OrquestacionTrabajadorModule {}
