import { Module } from "@nestjs/common";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { CuotaPlanSuscripciones } from "./adaptadores/cuota-plan.suscripciones";
import { OrquestacionService } from "./orquestacion.service";
import { PasoEjecucion } from "./paso-ejecucion";
import { PasoOperacion } from "./paso-operacion";
import { CuotaPlanPuerto } from "./puertos/cuota-plan.puerto";

/** Lo que M5 aporta al proceso trabajador. Los límites del contenedor salen del plan (M2). */
@Module({
  imports: [SuscripcionesModule],
  providers: [
    OrquestacionService,
    PasoEjecucion,
    PasoOperacion,
    { provide: CuotaPlanPuerto, useClass: CuotaPlanSuscripciones },
  ],
  exports: [OrquestacionService, PasoEjecucion, PasoOperacion],
})
export class OrquestacionTrabajadorModule {}
