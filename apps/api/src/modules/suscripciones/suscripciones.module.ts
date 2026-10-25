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
import { AltaPrimerUsuario } from "./modo/alta-primer-usuario.puerto";
import { ComoCliente, ConCodigoDeConfiguracion } from "./modo/altas";
import { CatalogoPlanes } from "./modo/catalogo-planes.puerto";
import { CatalogoAutoalojado, CatalogoNube } from "./modo/catalogos";
import { CobroDisponibleGuard } from "./modo/cobro-disponible.guard";
import { CuotasDelPlan, LimitesDeInstalacion } from "./modo/cuotas";
import { InstalacionController } from "./modo/instalacion.controller";
import { MODO_INSTALACION, porModo, PROVEEDOR_MODO } from "./modo/modo-instalacion";
import { PoliticaCuotas } from "./modo/politica-cuotas.puerto";
import { RepositorioConfiguracionInstalacionPrisma } from "./modo/repositorio-configuracion-instalacion.prisma";
import { RepositorioConfiguracionInstalacion } from "./modo/repositorio-configuracion-instalacion.puerto";
import { SuscripcionesController } from "./suscripciones.controller";
import { SuscripcionesService } from "./suscripciones.service";

/**
 * `ContratacionService` se exporta para `CobroModule` (las rutas con sesión de M2) y
 * `RepositorioSuscripciones` para el ciclo §4.4 (`CicloModule` y `CicloTrabajadorModule`);
 * `RepositorioPagos` para el historial de pagos de `CobroModule` (M2-06).
 * Modo de instalación (SP-06, ADR 0008): `porModo` registra la estrategia de cada puerto según
 * `MODO_INSTALACION`; el modo, el catálogo, el alta del primer usuario y la configuración se
 * exportan para el cobro, el ciclo, el asistente de M1 y Admin · Instalación de M9.
 */
@Module({
  controllers: [SuscripcionesController, InstalacionController],
  providers: [
    SuscripcionesService,
    PROVEEDOR_MODO,
    CobroDisponibleGuard,
    { provide: RepositorioConfiguracionInstalacion, useClass: RepositorioConfiguracionInstalacionPrisma },
    ...porModo(CatalogoPlanes, { nube: CatalogoNube, autoalojado: CatalogoAutoalojado }),
    ...porModo(PoliticaCuotas, { nube: CuotasDelPlan, autoalojado: LimitesDeInstalacion }),
    ...porModo(AltaPrimerUsuario, { nube: ComoCliente, autoalojado: ConCodigoDeConfiguracion }),
    ContratacionService,
    { provide: RepositorioPlanes, useClass: RepositorioPlanesPrisma },
    { provide: RepositorioSuscripciones, useClass: RepositorioSuscripcionesPrisma },
    { provide: RepositorioPagos, useClass: RepositorioPagosPrisma },
    { provide: PasarelaPago, useClass: PasarelaSimulada },
    { provide: Espera, useClass: EsperaTemporizador },
  ],
  exports: [
    SuscripcionesService,
    ContratacionService,
    RepositorioSuscripciones,
    RepositorioPagos,
    MODO_INSTALACION,
    CatalogoPlanes,
    CobroDisponibleGuard,
    AltaPrimerUsuario,
    RepositorioConfiguracionInstalacion,
  ],
})
export class SuscripcionesModule {}
