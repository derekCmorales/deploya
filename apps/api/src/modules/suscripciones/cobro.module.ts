import { Module } from "@nestjs/common";
import { IdentidadModule } from "../identidad/identidad.module";
import { CicloModule } from "./ciclo/ciclo.module";
import { CobroController } from "./cobro.controller";
import { SuscripcionesModule } from "./suscripciones.module";

/**
 * Rutas con sesión de M2. Van aparte de `SuscripcionesModule` porque M1 importa ese módulo
 * (`asignarSandbox`) y M2 necesita el `SesionGuard` de M1: así no hay import circular.
 * Contratar pasa por `ReactivacionService` del ciclo (reanuda los contenedores de una Suspendida).
 */
@Module({
  imports: [IdentidadModule, SuscripcionesModule, CicloModule],
  controllers: [CobroController],
})
export class CobroModule {}
