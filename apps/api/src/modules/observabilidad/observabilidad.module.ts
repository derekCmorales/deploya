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
import { TiemposModule } from "./tiempos/tiempos.module";
import { BitacoraEjecucionService } from "./bitacora/bitacora-ejecucion.service";
import { BitacoraProyectoController } from "./bitacora/bitacora-proyecto.controller";

/**
 * M7: modelo de lectura sobre lo que exportan M3, M4 y M5 (consumo del período y actividad).
 * `TiemposModule` se registra en `AppModule` antes de `ProyectosModule` para ganarle la ruta a
 * `/despliegues/:numero`; aquí se importa para mantener el módulo dueño de la feature.
 */
@Module({
  imports: [TiemposModule, IdentidadModule, ConstruccionModule, OrquestacionModule, ProyectosModule],
  controllers: [
    ObservabilidadController,
    ResumenProyectoController,
    ConsumoController,
    ActividadController,
    MetricasProyectoController,
    BitacoraProyectoController,
  ],
  providers: [ResumenProyectoService, ConsumoService, ActividadService, LecturaMetricasService, BitacoraEjecucionService],
})
export class ObservabilidadModule {}
