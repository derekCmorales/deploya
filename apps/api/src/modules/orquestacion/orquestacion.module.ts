import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { CuotaPlanSuscripciones } from "./adaptadores/cuota-plan.suscripciones";
import { BloqueosDespliegueFilter } from "./bloqueos-despliegue.filter";
import { BloqueosService } from "./bloqueos.service";
import { OrquestacionController } from "./orquestacion.controller";
import { CuotaPlanPuerto } from "./puertos/cuota-plan.puerto";

/**
 * M5 en el proceso API: exporta `BloqueosService` (M4 y M3 lo llaman antes de construir)
 * y traduce sus rechazos a 409 en cualquier ruta.
 */
@Module({
  imports: [SuscripcionesModule],
  controllers: [OrquestacionController],
  providers: [
    BloqueosService,
    { provide: CuotaPlanPuerto, useClass: CuotaPlanSuscripciones },
    { provide: APP_FILTER, useClass: BloqueosDespliegueFilter },
  ],
  exports: [BloqueosService],
})
export class OrquestacionModule {}
