import { Module } from "@nestjs/common";
import { IdentidadModule } from "../../identidad/identidad.module";
import { RegistroLimpiezaPrisma } from "./adaptadores/registro-limpieza.prisma";
import { LimpiezaController } from "./limpieza.controller";
import { LimpiezaService } from "./limpieza.service";
import { RegistroLimpiezaPuerto } from "./puertos/registro-limpieza.puerto";

/**
 * Limpieza diaria en la API (EST-01b): `POST /admin/limpieza/ejecutar` y la última corrida para
 * la pantalla 32. `PurgaDatosVencidosPuerto` lo da `AdaptersModule` (Prisma en ambos modos).
 */
@Module({
  imports: [IdentidadModule],
  controllers: [LimpiezaController],
  providers: [LimpiezaService, { provide: RegistroLimpiezaPuerto, useClass: RegistroLimpiezaPrisma }],
  exports: [RegistroLimpiezaPuerto],
})
export class LimpiezaModule {}
