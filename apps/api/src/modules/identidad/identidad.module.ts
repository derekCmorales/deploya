import { Module } from "@nestjs/common";
import { NotificacionesModule } from "../notificaciones/notificaciones.module";
import { AsignacionSandboxStub } from "./adaptadores/asignacion-sandbox.stub";
import { GeneradorTokenCripto } from "./adaptadores/generador-token-cripto";
import { HashContrasenaScrypt } from "./adaptadores/hash-contrasena-scrypt";
import { RepositorioTokensCuentaMemoria } from "./adaptadores/repositorio-tokens-cuenta.memoria";
import { RepositorioUsuariosMemoria } from "./adaptadores/repositorio-usuarios.memoria";
import { CONFIGURACION_IDENTIDAD, configuracionIdentidadDesde } from "./configuracion-identidad";
import { IdentidadController } from "./identidad.controller";
import { IdentidadService } from "./identidad.service";
import { AsignacionSandboxPuerto } from "./puertos/asignacion-sandbox.puerto";
import { GeneradorToken } from "./puertos/generador-token.puerto";
import { HashContrasena } from "./puertos/hash-contrasena.puerto";
import { RepositorioTokensCuenta } from "./puertos/repositorio-tokens-cuenta.puerto";
import { RepositorioUsuarios } from "./puertos/repositorio-usuarios.puerto";

/**
 * Binding de M1. Repositorios en memoria y Sandbox en stub hasta DB-01 y M2: al llegar,
 * solo cambian estas líneas (el servicio depende de los puertos).
 */
@Module({
  imports: [NotificacionesModule],
  controllers: [IdentidadController],
  providers: [
    IdentidadService,
    { provide: CONFIGURACION_IDENTIDAD, useFactory: () => configuracionIdentidadDesde(process.env) },
    { provide: RepositorioUsuarios, useClass: RepositorioUsuariosMemoria },
    { provide: RepositorioTokensCuenta, useClass: RepositorioTokensCuentaMemoria },
    { provide: HashContrasena, useClass: HashContrasenaScrypt },
    { provide: GeneradorToken, useClass: GeneradorTokenCripto },
    { provide: AsignacionSandboxPuerto, useClass: AsignacionSandboxStub },
  ],
  exports: [IdentidadService],
})
export class IdentidadModule {}
