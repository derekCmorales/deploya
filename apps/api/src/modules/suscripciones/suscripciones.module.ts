import { Module } from "@nestjs/common";
import { RepositorioPlanesPrisma } from "./adaptadores/repositorio-planes.prisma";
import { RepositorioSuscripcionesPrisma } from "./adaptadores/repositorio-suscripciones.prisma";
import { RepositorioPlanes } from "./puertos/repositorio-planes.puerto";
import { RepositorioSuscripciones } from "./puertos/repositorio-suscripciones.puerto";
import { SuscripcionesController } from "./suscripciones.controller";
import { SuscripcionesService } from "./suscripciones.service";

@Module({
  controllers: [SuscripcionesController],
  providers: [
    SuscripcionesService,
    { provide: RepositorioPlanes, useClass: RepositorioPlanesPrisma },
    { provide: RepositorioSuscripciones, useClass: RepositorioSuscripcionesPrisma },
  ],
  exports: [SuscripcionesService],
})
export class SuscripcionesModule {}
