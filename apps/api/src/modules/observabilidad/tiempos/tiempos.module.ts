import { Module } from "@nestjs/common";
import { IdentidadModule } from "../../identidad/identidad.module";
import { TiemposController } from "./tiempos.controller";
import { TiemposService } from "./tiempos.service";

/**
 * Se importa en `AppModule` antes de `ProyectosModule` (que arrastra `ConstruccionModule`)
 * para que `/despliegues/tiempos` no caiga en `/despliegues/:numero`.
 */
@Module({
  imports: [IdentidadModule],
  controllers: [TiemposController],
  providers: [TiemposService],
  exports: [TiemposService],
})
export class TiemposModule {}
