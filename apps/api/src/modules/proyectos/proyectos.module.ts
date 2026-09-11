import { Module } from "@nestjs/common";
import { ProyectosController } from "./proyectos.controller";

@Module({
  controllers: [ProyectosController],
})
export class ProyectosModule {}
