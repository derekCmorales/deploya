import { Module } from "@nestjs/common";
import { IdentidadModule } from "../../identidad/identidad.module";
import { OrquestacionModule } from "../../orquestacion/orquestacion.module";
import { SuscripcionesModule } from "../suscripciones.module";
import { CicloController } from "./ciclo.controller";
import { CicloSuscripcionService } from "./ciclo-suscripcion.service";
import { ReactivacionService } from "./reactivacion.service";

/**
 * Ciclo §4.4 en la API (M2-05). Módulo aparte porque necesita `ContenedoresClientePuerto` de
 * `OrquestacionModule`, que ya importa `SuscripcionesModule`: así no hay import circular.
 * Exporta `ReactivacionService` para que `CobroModule` reanude al renovar una Suspendida.
 */
@Module({
  imports: [SuscripcionesModule, OrquestacionModule, IdentidadModule],
  controllers: [CicloController],
  providers: [CicloSuscripcionService, ReactivacionService],
  exports: [ReactivacionService],
})
export class CicloModule {}
