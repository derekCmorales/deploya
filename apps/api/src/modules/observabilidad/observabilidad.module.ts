import { Module } from "@nestjs/common";
import { ConstruccionModule } from "../construccion/construccion.module";
import { IdentidadModule } from "../identidad/identidad.module";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { ObservabilidadController } from "./observabilidad.controller";
import { ResumenProyectoController } from "./resumen/resumen-proyecto.controller";
import { ResumenProyectoService } from "./resumen/resumen-proyecto.service";

/** M7: modelo de lectura sobre lo que exportan M3, M4 y M5. `DetalleProyectoPuerto` lo provee `AdaptersModule`. */
@Module({
  imports: [IdentidadModule, ConstruccionModule, OrquestacionModule],
  controllers: [ObservabilidadController, ResumenProyectoController],
  providers: [ResumenProyectoService],
})
export class ObservabilidadModule {}
