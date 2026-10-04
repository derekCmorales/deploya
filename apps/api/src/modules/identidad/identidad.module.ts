import { Module } from "@nestjs/common";
import { NotificacionesModule } from "../notificaciones/notificaciones.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { AsignacionSandboxSuscripciones } from "./adaptadores/asignacion-sandbox.suscripciones";
import { GeneradorTokenCripto } from "./adaptadores/generador-token-cripto";
import { HashContrasenaScrypt } from "./adaptadores/hash-contrasena-scrypt";
import { RepositorioSesionesPrisma } from "./adaptadores/repositorio-sesiones.prisma";
import { RepositorioTokensCuentaPrisma } from "./adaptadores/repositorio-tokens-cuenta.prisma";
import { RepositorioUsuariosPrisma } from "./adaptadores/repositorio-usuarios.prisma";
import { configuracionCookieDesde } from "./cookie-sesion";
import { CONFIGURACION_IDENTIDAD, configuracionIdentidadDesde } from "./configuracion-identidad";
import { IdentidadController } from "./identidad.controller";
import { IdentidadService } from "./identidad.service";
import { AsignacionSandboxPuerto } from "./puertos/asignacion-sandbox.puerto";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { RepositorioSesiones } from "./puertos/repositorio-sesiones.puerto";
import { RepositorioTokensCuenta } from "./puertos/repositorio-tokens-cuenta.puerto";
import { RepositorioUsuarios } from "./puertos/repositorio-usuarios.puerto";
import { RolGuard } from "./rol.guard";
import { CONFIGURACION_COOKIE, SesionController } from "./sesion.controller";
import { SesionGuard } from "./sesion.guard";
import { SesionService } from "./sesion.service";

/**
 * Binding de M1: repositorios en PostgreSQL (DB-01) y Sandbox vía la Facade de M2.
 * Exporta `SesionGuard` y `SesionService` para que M3 y M4 protejan sus rutas, y `RolGuard`
 * para las rutas de administración (M9).
 */
@Module({
  imports: [NotificacionesModule, SuscripcionesModule],
  controllers: [IdentidadController, SesionController],
  providers: [
    IdentidadService,
    SesionService,
    SesionGuard,
    RolGuard,
    { provide: CONFIGURACION_IDENTIDAD, useFactory: () => configuracionIdentidadDesde(process.env) },
    { provide: CONFIGURACION_COOKIE, useFactory: () => configuracionCookieDesde(process.env) },
    { provide: RepositorioUsuarios, useClass: RepositorioUsuariosPrisma },
    { provide: RepositorioTokensCuenta, useClass: RepositorioTokensCuentaPrisma },
    { provide: RepositorioSesiones, useClass: RepositorioSesionesPrisma },
    { provide: HashContrasena, useClass: HashContrasenaScrypt },
    { provide: GeneradorToken, useClass: GeneradorTokenCripto },
    { provide: AsignacionSandboxPuerto, useClass: AsignacionSandboxSuscripciones },
  ],
  exports: [IdentidadService, SesionService, SesionGuard, RolGuard],
})
export class IdentidadModule {}
