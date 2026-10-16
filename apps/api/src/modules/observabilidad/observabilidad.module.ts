import { Module } from "@nestjs/common";
import { ConstruccionModule } from "../construccion/construccion.module";
import { IdentidadModule } from "../identidad/identidad.module";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { ObservabilidadController } from "./observabilidad.controller";
import { ResumenProyectoController } from "./resumen/resumen-proyecto.controller";
import { ResumenProyectoService } from "./resumen/resumen-proyecto.service";
import { ConsumoService } from "./consumo/consumo.service";
import { ConsumoController } from "./consumo/consumo.controller";

@Module({
  imports: [IdentidadModule, ConstruccionModule, OrquestacionModule],
  controllers: [ObservabilidadController, ResumenProyectoController, ConsumoController],
  providers: [ResumenProyectoService, ConsumoService],
})
export class ObservabilidadModule {}