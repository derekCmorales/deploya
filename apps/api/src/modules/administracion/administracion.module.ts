import { Module } from "@nestjs/common";
import { IdentidadModule } from "../identidad/identidad.module";
import { AdministracionController } from "./administracion.controller";

/** La sesión y el rol salen de M1 (`SesionGuard` y `RolGuard`). */
@Module({
  imports: [IdentidadModule],
  controllers: [AdministracionController],
})
export class AdministracionModule {}
