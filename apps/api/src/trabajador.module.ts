import { Module } from "@nestjs/common";
import { AdaptersModule } from "./adapters/adapters.module";
import { ConstruccionTrabajadorModule } from "./modules/construccion/construccion-trabajador.module";

/** Raíz del proceso trabajador (`node dist/trabajador.js`, ADR 0002). */
@Module({
  imports: [AdaptersModule.paraTrabajador(), ConstruccionTrabajadorModule],
})
export class TrabajadorModule {}
