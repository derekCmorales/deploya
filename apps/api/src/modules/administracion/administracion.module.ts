import { Module } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { CertificadoPuerto } from "../enrutamiento/puertos/certificado.puerto";
import { IdentidadModule } from "../identidad/identidad.module";
import { RegistroEnviosCorreo } from "../notificaciones/puertos/registro-envios.puerto";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { AdministracionController } from "./administracion.controller";
import { ConsultaUsuariosPrisma } from "./adaptadores/consulta-usuarios.prisma";
import { CuentasSuspensionPrisma } from "./adaptadores/cuentas-suspension.prisma";
import { ConsultaUsuariosPuerto } from "./puertos/consulta-usuarios.puerto";
import { EstadoScriptsArchivos } from "./instalacion/adaptadores/estado-scripts.archivos";
import { RegistroAccionesPrisma } from "./instalacion/adaptadores/registro-acciones.prisma";
import { ResolutorDnsNode } from "./instalacion/adaptadores/resolutor-dns.node";
import { InstalacionAdminController } from "./instalacion/instalacion-admin.controller";
import { DOMINIO_INSTALACION, InstalacionService, SALUD_INSTALACION } from "./instalacion/instalacion.service";
import { InvitacionesService, URL_WEB_INSTALACION } from "./instalacion/invitaciones.service";
import { EstadoScriptsPuerto } from "./instalacion/puertos/estado-scripts.puerto";
import { RegistroAccionesPuerto } from "./instalacion/puertos/registro-acciones.puerto";
import { ReporteServidorPuerto } from "./instalacion/puertos/reporte-servidor.puerto";
import { ResolutorDnsPuerto } from "./instalacion/puertos/resolutor-dns.puerto";
import { RegistroInstalacionModule } from "./instalacion/registro-instalacion.module";
import { SaludInstalacion } from "./instalacion/salud/comprobacion";
import {
  ComprobacionCertificado,
  ComprobacionCorreo,
  ComprobacionDisco,
  ComprobacionDnsComodin,
  ComprobacionDocker,
} from "./instalacion/salud/comprobaciones";
import { CuentasSuspensionPuerto } from "./puertos/cuentas-suspension.puerto";
import { ReactivacionCuentaService } from "./reactivacion-cuenta.service";
import { SuspensionService } from "./suspension.service";
import { UsuariosAdminController } from "./usuarios-admin.controller";

/** Dónde deja `respaldar.sh` y `actualizar.sh` su estado (montado de solo lectura en la API). */
const DIRECTORIO_RESPALDOS = process.env.DIR_RESPALDOS ?? "/var/backups/deploya";

/**
 * La sesión y el rol salen de M1 (`SesionGuard` y `RolGuard`); detener los contenedores de una
 * cuenta suspendida y reanudarlos al reactivarla, de M5 (`ContenedoresClientePuerto`). Admin ·
 * Instalación (SP-18) lee el modo y la configuración de M2, y la salud la arma un Composite.
 */
@Module({
  imports: [IdentidadModule, OrquestacionModule, SuscripcionesModule, RegistroInstalacionModule],
  controllers: [AdministracionController, UsuariosAdminController, InstalacionAdminController],
  providers: [
    InstalacionService,
    InvitacionesService,
    { provide: RegistroAccionesPuerto, useClass: RegistroAccionesPrisma },
    { provide: EstadoScriptsPuerto, useFactory: () => new EstadoScriptsArchivos(DIRECTORIO_RESPALDOS) },
    { provide: ResolutorDnsPuerto, useClass: ResolutorDnsNode },
    { provide: URL_WEB_INSTALACION, useFactory: () => (process.env.URL_WEB ?? "http://localhost:3000").replace(/\/+$/, "") },
    { provide: DOMINIO_INSTALACION, useFactory: () => process.env.DOMINIO_BASE ?? "localhost" },
    {
      provide: SALUD_INSTALACION,
      useFactory: (
        reportes: ReporteServidorPuerto,
        envios: RegistroEnviosCorreo,
        certificado: CertificadoPuerto,
        dns: ResolutorDnsPuerto,
        reloj: Reloj,
        dominio: string,
      ) =>
        new SaludInstalacion([
          new ComprobacionDocker(reportes, reloj),
          new ComprobacionDnsComodin(dns, dominio),
          new ComprobacionCertificado(certificado, dominio, reloj),
          new ComprobacionDisco(reportes, reloj),
          new ComprobacionCorreo(envios, reloj),
        ]),
      inject: [ReporteServidorPuerto, RegistroEnviosCorreo, CertificadoPuerto, ResolutorDnsPuerto, Reloj, DOMINIO_INSTALACION],
    },
    SuspensionService,
    ReactivacionCuentaService,
    { provide: ConsultaUsuariosPuerto, useClass: ConsultaUsuariosPrisma },
    { provide: CuentasSuspensionPuerto, useClass: CuentasSuspensionPrisma },
  ],
})
export class AdministracionModule {}
