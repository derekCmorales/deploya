import { Module } from "@nestjs/common";
import { IdentidadModule } from "../identidad/identidad.module";
import { CobroController } from "./cobro.controller";
import { SuscripcionesModule } from "./suscripciones.module";

/**
 * Rutas con sesión de M2. Van aparte de `SuscripcionesModule` porque M1 importa ese módulo
 * (`asignarSandbox`) y M2 necesita el `SesionGuard` de M1: así no hay import circular.
 */
@Module({
  imports: [IdentidadModule, SuscripcionesModule],
  controllers: [CobroController],
})
export class CobroModule {}
