import { Module } from "@nestjs/common";
import { SuscripcionesController } from "./suscripciones.controller";

@Module({
  controllers: [SuscripcionesController],
})
export class SuscripcionesModule {}
