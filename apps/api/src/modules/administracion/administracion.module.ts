import { Module } from "@nestjs/common";
import { IdentidadModule } from "../identidad/identidad.module";
import { OrquestacionModule } from "../orquestacion/orquestacion.module";
import { AdministracionController } from "./administracion.controller";
import { ConsultaUsuariosPrisma } from "./adaptadores/consulta-usuarios.prisma";
import { CuentasSuspensionPrisma } from "./adaptadores/cuentas-suspension.prisma";
import { ConsultaUsuariosPuerto } from "./puertos/consulta-usuarios.puerto";
import { CuentasSuspensionPuerto } from "./puertos/cuentas-suspension.puerto";
import { ReactivacionCuentaService } from "./reactivacion-cuenta.service";
import { SuspensionService } from "./suspension.service";
import { UsuariosAdminController } from "./usuarios-admin.controller";

/**
 * La sesión y el rol salen de M1 (`SesionGuard` y `RolGuard`); detener los contenedores de una
 * cuenta suspendida y reanudarlos al reactivarla, de M5 (`ContenedoresClientePuerto`).
 */
@Module({
  imports: [IdentidadModule, OrquestacionModule],
  controllers: [AdministracionController, UsuariosAdminController],
  providers: [
    SuspensionService,
    ReactivacionCuentaService,
    { provide: ConsultaUsuariosPuerto, useClass: ConsultaUsuariosPrisma },
    { provide: CuentasSuspensionPuerto, useClass: CuentasSuspensionPrisma },
  ],
})
export class AdministracionModule {}
