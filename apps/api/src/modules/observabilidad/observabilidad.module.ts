import { Module } from "@nestjs/common";
import { ConstruccionModule } from "../construccion/construccion.module";
import { IdentidadModule } from "../identidad/identidad.module";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { ProyectosModule } from "../proyectos/proyectos.module";
import { ObservabilidadController } from "./observabilidad.controller";
import { ResumenProyectoController } from "./resumen/resumen-proyecto.controller";
import { ResumenProyectoService } from "./resumen/resumen-proyecto.service";
import { ConsumoService } from "./consumo/consumo.service";
import { ConsumoController } from "./consumo/consumo.controller";
import { ActividadService } from "./actividad/actividad.service";
import { ActividadController } from "./actividad/actividad.controller";
import { LecturaMetricasService } from "./metricas/lectura-metricas.service";
import { MetricasProyectoController } from "./metricas/metricas-proyecto.controller";

/**
 * M7: modelo de lectura sobre lo que exportan M3, M4 y M5 (consumo del período y actividad).
 */
@Module({
  imports: [IdentidadModule, ConstruccionModule, OrquestacionModule, ProyectosModule],
  controllers: [ObservabilidadController, ResumenProyectoController, ConsumoController, ActividadController, MetricasProyectoController],
  providers: [ResumenProyectoService, ConsumoService, ActividadService, LecturaMetricasService],
})
export class ObservabilidadModule {}
