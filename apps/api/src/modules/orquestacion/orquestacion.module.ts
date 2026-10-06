import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { IdentidadModule } from "../identidad/identidad.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { AccionesProyectoService } from "./acciones/acciones-proyecto.service";
import { AccionesController } from "./acciones/acciones.controller";
import { CuotaPlanSuscripciones } from "./adaptadores/cuota-plan.suscripciones";
import { BloqueosService } from "./bloqueos.service";
import { OrquestacionController } from "./orquestacion.controller";
import { CuotaPlanPuerto } from "./puertos/cuota-plan.puerto";
import { RechazosOrquestacionFilter } from "./rechazos-orquestacion.filter";

/**
 * M5 en el proceso API: exporta `BloqueosService` (M4 y M3 lo llaman antes de construir) y
 * `AccionesProyectoService` (M3 pide borrar los recursos al eliminar); traduce sus rechazos a 409.
 */
@Module({
  imports: [SuscripcionesModule, IdentidadModule],
  controllers: [OrquestacionController, AccionesController],
  providers: [
    BloqueosService,
    AccionesProyectoService,
    { provide: CuotaPlanPuerto, useClass: CuotaPlanSuscripciones },
    { provide: APP_FILTER, useClass: RechazosOrquestacionFilter },
  ],
  exports: [BloqueosService, AccionesProyectoService],
})
export class OrquestacionModule {}
