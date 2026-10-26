import { Module } from "@nestjs/common";
import { RegistroInstalacionModule } from "../administracion/instalacion/registro-instalacion.module";
import { NotificacionesModule } from "../notificaciones/notificaciones.module";
import { VariablesModule } from "../proyectos/variables.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { AsignacionSandboxSuscripciones } from "./adaptadores/asignacion-sandbox.suscripciones";
import { GeneradorTokenCripto } from "./adaptadores/generador-token-cripto";
import { HashContrasenaScrypt } from "./adaptadores/hash-contrasena-scrypt";
import { RepositorioSesionesPrisma } from "./adaptadores/repositorio-sesiones.prisma";
import { RepositorioTokensCuentaPrisma } from "./adaptadores/repositorio-tokens-cuenta.prisma";
import { RepositorioUsuariosPrisma } from "./adaptadores/repositorio-usuarios.prisma";
import { CONFIGURACION_COOKIE, configuracionCookieDesde } from "./cookie-sesion";
import { CONFIGURACION_IDENTIDAD, configuracionIdentidadDesde } from "./configuracion-identidad";
import { CuentaController } from "./cuenta.controller";
import { CuentaService } from "./cuenta.service";
import { DirectorioCuentas } from "./directorio-cuentas.service";
import { IdentidadController } from "./identidad.controller";
import { IdentidadService } from "./identidad.service";
import { AsistenteDisponibleGuard } from "./instalacion/asistente-disponible.guard";
import { LimiteIntentos } from "./instalacion/limite-intentos";
import { PrimeraConfiguracionController } from "./instalacion/primera-configuracion.controller";
import { LIMITE_INTENTOS_CODIGO, PrimeraConfiguracionService } from "./instalacion/primera-configuracion.service";
import { AsignacionSandboxPuerto } from "./puertos/asignacion-sandbox.puerto";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { RepositorioSesiones } from "./puertos/repositorio-sesiones.puerto";
import { RepositorioTokensCuenta } from "./puertos/repositorio-tokens-cuenta.puerto";
import { RepositorioUsuarios } from "./puertos/repositorio-usuarios.puerto";
import { RolGuard } from "./rol.guard";
import { RecuperacionController } from "./recuperacion.controller";
import { RecuperacionService } from "./recuperacion.service";
import { SesionController } from "./sesion.controller";
import { SesionGuard } from "./sesion.guard";
import { SesionService } from "./sesion.service";

/**
 * Binding de M1: repositorios en PostgreSQL (DB-01) y Sandbox vía la Facade de M2.
 * Exporta `SesionGuard` y `SesionService` para que M3 y M4 protejan sus rutas, y `RolGuard`
 * para las rutas de administración (M9). El asistente de primera configuración (31, SP-17) vive
 * aquí porque crea la cuenta y la sesión; cifra la clave del SMTP con `CifradorVariables`.
 */
@Module({
  imports: [NotificacionesModule, SuscripcionesModule, RegistroInstalacionModule, VariablesModule],
  controllers: [IdentidadController, SesionController, RecuperacionController, CuentaController, PrimeraConfiguracionController],
  providers: [
    IdentidadService,
    SesionService,
    RecuperacionService,
    CuentaService,
    DirectorioCuentas,
    PrimeraConfiguracionService,
    AsistenteDisponibleGuard,
    { provide: LIMITE_INTENTOS_CODIGO, useValue: new LimiteIntentos() },
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
  exports: [IdentidadService, SesionService, SesionGuard, RolGuard, DirectorioCuentas],
})
export class IdentidadModule {}
