import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { AdaptersModule } from "./adapters/adapters.module";
import { IdentidadModule } from "./modules/identidad/identidad.module";
import { NotificacionesModule } from "./modules/notificaciones/notificaciones.module";
import { SuscripcionesModule } from "./modules/suscripciones/suscripciones.module";
import { AdministracionModule } from "./modules/administracion/administracion.module";
import { ProyectosModule } from "./modules/proyectos/proyectos.module";
import { ObservabilidadModule } from "./modules/observabilidad/observabilidad.module";
import { ConstruccionModule } from "./modules/construccion/construccion.module";
import { OrquestacionModule } from "./modules/orquestacion/orquestacion.module";
import { EnrutamientoModule } from "./modules/enrutamiento/enrutamiento.module";
import { HerramientasModule } from "./modules/herramientas/herramientas.module";

@Module({
  imports: [
    AdaptersModule,
    IdentidadModule,
    NotificacionesModule,
    SuscripcionesModule,
    AdministracionModule,
    ProyectosModule,
    ObservabilidadModule,
    ConstruccionModule,
    OrquestacionModule,
    EnrutamientoModule,
    HerramientasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
