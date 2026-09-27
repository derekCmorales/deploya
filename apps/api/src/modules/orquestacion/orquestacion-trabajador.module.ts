import { Module } from "@nestjs/common";
import { OrquestacionService } from "./orquestacion.service";
import { PasoEjecucion } from "./paso-ejecucion";
import { PasoOperacion } from "./paso-operacion";

/** Lo que M5 aporta al proceso trabajador. */
@Module({
  providers: [OrquestacionService, PasoEjecucion, PasoOperacion],
  exports: [OrquestacionService, PasoEjecucion, PasoOperacion],
})
export class OrquestacionTrabajadorModule {}
