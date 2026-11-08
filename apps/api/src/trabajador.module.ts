import { Module } from "@nestjs/common";
import { AdaptersModule } from "./adapters/adapters.module";
import { PrismaModule } from "./compartido/prisma/prisma.module";
import { InstalacionTrabajadorModule } from "./modules/administracion/instalacion/instalacion-trabajador.module";
import { LimpiezaTrabajadorModule } from "./modules/administracion/limpieza/limpieza-trabajador.module";
import { ConstruccionTrabajadorModule } from "./modules/construccion/construccion-trabajador.module";
import { CicloTrabajadorModule } from "./modules/suscripciones/ciclo/ciclo-trabajador.module";

/**
 * Raíz del proceso trabajador (`node dist/trabajador.js`, ADR 0002); también corre la tarea diaria
 * del ciclo §4.4, el reporte del servidor de Admin · Instalación (SP-18) y la limpieza diaria (EST-01b).
 */
@Module({
  imports: [AdaptersModule.paraTrabajador(), PrismaModule, ConstruccionTrabajadorModule, CicloTrabajadorModule, InstalacionTrabajadorModule, LimpiezaTrabajadorModule],
})
export class TrabajadorModule {}
