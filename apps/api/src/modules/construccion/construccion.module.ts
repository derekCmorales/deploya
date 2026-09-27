import { Module } from "@nestjs/common";
import { ConstruccionController } from "./construccion.controller";
import { ConstruccionService } from "./construccion.service";
import { DesplieguesController } from "./despliegues.controller";

@Module({
  controllers: [ConstruccionController, DesplieguesController],
  providers: [ConstruccionService],
  exports: [ConstruccionService],
})
export class ConstruccionModule {}
