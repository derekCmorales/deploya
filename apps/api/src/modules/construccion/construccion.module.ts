import { Module } from "@nestjs/common";
import { IdentidadModule } from "../identidad/identidad.module";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { AccionesDespliegueController } from "./acciones/acciones-despliegue.controller";
import { AccionesDespliegueService } from "./acciones/acciones-despliegue.service";
import { ConstruccionController } from "./construccion.controller";
import { ConstruccionService } from "./construccion.service";
import { DesplieguesController } from "./despliegues.controller";
import { DeteccionStackService, PROVEEDORES_DETECCION } from "./deteccion/deteccion-stack.service";

@Module({
  imports: [IdentidadModule, OrquestacionModule],
  controllers: [ConstruccionController, DesplieguesController, AccionesDespliegueController],
  providers: [ConstruccionService, AccionesDespliegueService, ...PROVEEDORES_DETECCION],
  exports: [ConstruccionService, DeteccionStackService],
})
export class ConstruccionModule {}
