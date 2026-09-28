import { Module } from "@nestjs/common";
import { transporteNodemailer } from "./adaptadores/transporte-nodemailer";
import { configuracionCorreoDesde, correoSegun } from "./configuracion-correo";
import { NotificacionesController } from "./notificaciones.controller";
import { CorreoPuerto } from "./puertos/correo.puerto";

@Module({
  controllers: [NotificacionesController],
  providers: [
    {
      provide: CorreoPuerto,
      useFactory: () => correoSegun(configuracionCorreoDesde(process.env), transporteNodemailer),
    },
  ],
  exports: [CorreoPuerto],
})
export class NotificacionesModule {}
