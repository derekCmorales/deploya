import { Module } from "@nestjs/common";
import { AdaptersModule } from "./adapters/adapters.module";
import { PrismaModule } from "./compartido/prisma/prisma.module";
import { ConstruccionTrabajadorModule } from "./modules/construccion/construccion-trabajador.module";

/** Raíz del proceso trabajador (`node dist/trabajador.js`, ADR 0002). */
@Module({
  imports: [AdaptersModule.paraTrabajador(), PrismaModule, ConstruccionTrabajadorModule],
})
export class TrabajadorModule {}
