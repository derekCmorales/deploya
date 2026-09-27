import { Module } from "@nestjs/common";
import { EnrutamientoService } from "./enrutamiento.service";
import { PasoEnrutamiento } from "./paso-enrutamiento";

/** Lo que M6 aporta al proceso trabajador. */
@Module({
  providers: [EnrutamientoService, PasoEnrutamiento],
  exports: [EnrutamientoService, PasoEnrutamiento],
})
export class EnrutamientoTrabajadorModule {}
