import { Module } from "@nestjs/common";
import { EnrutamientoController } from "./enrutamiento.controller";

@Module({
  controllers: [EnrutamientoController],
})
export class EnrutamientoModule {}
