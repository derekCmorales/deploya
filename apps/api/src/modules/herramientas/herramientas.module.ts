import { Module } from "@nestjs/common";
import { HerramientasController } from "./herramientas.controller";

@Module({
  controllers: [HerramientasController],
})
export class HerramientasModule {}
