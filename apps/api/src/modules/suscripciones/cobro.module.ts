import { Module } from "@nestjs/common";
import { IdentidadModule } from "../identidad/identidad.module";
import { CicloModule } from "./ciclo/ciclo.module";
import { ComprobantePdfKit } from "./adaptadores/comprobante-pdfkit";
import { CobroController } from "./cobro.controller";
import { HistorialPagosService } from "./historial-pagos.service";
import { PagosController } from "./pagos.controller";
import { ComprobantePdfPuerto } from "./puertos/comprobante-pdf.puerto";
import { SuscripcionesModule } from "./suscripciones.module";

/**
 * Rutas con sesión de M2. Van aparte de `SuscripcionesModule` porque M1 importa ese módulo
 * (`asignarSandbox`) y M2 necesita el `SesionGuard` de M1: así no hay import circular.
 * Contratar pasa por `ReactivacionService` del ciclo (reanuda los contenedores de una Suspendida).
 * El historial de pagos y su PDF (M2-06) también van con sesión.
 */
@Module({
  imports: [IdentidadModule, SuscripcionesModule, CicloModule],
  controllers: [CobroController, PagosController],
  providers: [HistorialPagosService, { provide: ComprobantePdfPuerto, useClass: ComprobantePdfKit }],
})
export class CobroModule {}
