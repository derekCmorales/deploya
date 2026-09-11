import { Module } from "@nestjs/common";
import { ObservabilidadController } from "./observabilidad.controller";

@Module({
  controllers: [ObservabilidadController],
})
export class ObservabilidadModule {}
