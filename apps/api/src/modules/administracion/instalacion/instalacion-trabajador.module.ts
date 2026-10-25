import { Module } from "@nestjs/common";
import { TareaReporteServidor } from "./tarea-reporte-servidor";

/** En el trabajador: el reporte del servidor cada 10 min para la pantalla 32 (SP-18). */
@Module({ providers: [TareaReporteServidor] })
export class InstalacionTrabajadorModule {}
