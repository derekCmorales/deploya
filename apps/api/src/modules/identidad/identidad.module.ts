import { Module } from "@nestjs/common";
import { IdentidadController } from "./identidad.controller";

@Module({
  controllers: [IdentidadController],
})
export class IdentidadModule {}
