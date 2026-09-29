import { Module } from "@nestjs/common";
import { IdentidadModule } from "../identidad/identidad.module";
import { ConstruccionController } from "./construccion.controller";
import { ConstruccionService } from "./construccion.service";
import { DesplieguesController } from "./despliegues.controller";

@Module({
  imports: [IdentidadModule],
  controllers: [ConstruccionController, DesplieguesController],
  providers: [ConstruccionService],
  exports: [ConstruccionService],
})
export class ConstruccionModule {}
