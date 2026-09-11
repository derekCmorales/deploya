import { Module } from "@nestjs/common";
import { AdministracionController } from "./administracion.controller";

@Module({
  controllers: [AdministracionController],
})
export class AdministracionModule {}
