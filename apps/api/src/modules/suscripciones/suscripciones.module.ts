import { Module } from "@nestjs/common";
import { EsperaTemporizador } from "./adaptadores/espera-temporizador";
import { PasarelaSimulada } from "./adaptadores/pasarela-simulada";
import { RepositorioPagosPrisma } from "./adaptadores/repositorio-pagos.prisma";
import { RepositorioPlanesPrisma } from "./adaptadores/repositorio-planes.prisma";
import { RepositorioSuscripcionesPrisma } from "./adaptadores/repositorio-suscripciones.prisma";
import { ContratacionService } from "./contratacion.service";
import { Espera } from "./puertos/espera.puerto";
import { PasarelaPago } from "./puertos/pasarela-pago.puerto";
import { RepositorioPagos } from "./puertos/repositorio-pagos.puerto";
import { RepositorioPlanes } from "./puertos/repositorio-planes.puerto";
import { RepositorioSuscripciones } from "./puertos/repositorio-suscripciones.puerto";
import { SuscripcionesController } from "./suscripciones.controller";
import { SuscripcionesService } from "./suscripciones.service";

/** `ContratacionService` se exporta solo para `CobroModule` (las rutas con sesión de M2). */
@Module({
  controllers: [SuscripcionesController],
  providers: [
    SuscripcionesService,
    ContratacionService,
    { provide: RepositorioPlanes, useClass: RepositorioPlanesPrisma },
    { provide: RepositorioSuscripciones, useClass: RepositorioSuscripcionesPrisma },
    { provide: RepositorioPagos, useClass: RepositorioPagosPrisma },
    { provide: PasarelaPago, useClass: PasarelaSimulada },
    { provide: Espera, useClass: EsperaTemporizador },
  ],
  exports: [SuscripcionesService, ContratacionService],
})
export class SuscripcionesModule {}
