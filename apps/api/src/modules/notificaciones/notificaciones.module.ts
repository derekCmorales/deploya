import { Module } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { CorreoConRegistro } from "./adaptadores/correo-con-registro";
import { transporteNodemailer } from "./adaptadores/transporte-nodemailer";
import { configuracionCorreoDesde, correoSegun } from "./configuracion-correo";
import { NotificacionesController } from "./notificaciones.controller";
import { CorreoPuerto } from "./puertos/correo.puerto";
import { RegistroEnviosCorreo } from "./puertos/registro-envios.puerto";

@Module({
  controllers: [NotificacionesController],
  providers: [
    {
      provide: CorreoPuerto,
      // SP-18: cada envío deja su resultado en `RegistroEnviosCorreo` (Estado de la 32).
      useFactory: (registro: RegistroEnviosCorreo, reloj: Reloj) =>
        new CorreoConRegistro(correoSegun(configuracionCorreoDesde(process.env), transporteNodemailer), registro, reloj),
      inject: [RegistroEnviosCorreo, Reloj],
    },
  ],
  exports: [CorreoPuerto],
})
export class NotificacionesModule {}
