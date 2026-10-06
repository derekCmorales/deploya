import { Module } from "@nestjs/common";
import { IdentidadModule } from "../identidad/identidad.module";
import { ConstruccionController } from "./construccion.controller";
import { ConstruccionService } from "./construccion.service";
import { DesplieguesController } from "./despliegues.controller";
import { DeteccionStackService, PROVEEDORES_DETECCION } from "./deteccion/deteccion-stack.service";

@Module({
  imports: [IdentidadModule],
  controllers: [ConstruccionController, DesplieguesController],
  providers: [ConstruccionService, ...PROVEEDORES_DETECCION],
  exports: [ConstruccionService, DeteccionStackService],
})
export class ConstruccionModule {}
