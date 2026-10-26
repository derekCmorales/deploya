import { Module } from "@nestjs/common";
import { Reloj } from "../../compartido/reloj";
import { CifradorVariables } from "../proyectos/puertos/cifrador-variables.puerto";
import { VariablesModule } from "../proyectos/variables.module";
import { MODO_INSTALACION, type ModoInstalacion } from "../suscripciones/modo/modo-instalacion";
import { RepositorioConfiguracionInstalacion } from "../suscripciones/modo/repositorio-configuracion-instalacion.puerto";
import { SuscripcionesModule } from "../suscripciones/suscripciones.module";
import { CorreoConRegistro } from "./adaptadores/correo-con-registro";
import { transporteNodemailer } from "./adaptadores/transporte-nodemailer";
import { configuracionCorreoDesde, correoSegun } from "./configuracion-correo";
import { CorreoSegunInstalacion } from "./instalacion/correo-segun-instalacion";
import { FABRICA_CORREO_SMTP, fabricaCorreoSmtp, type FabricaCorreoSmtp } from "./instalacion/correo-smtp-de";
import { PruebaCorreoSmtp } from "./instalacion/prueba-correo-smtp";
import { NotificacionesController } from "./notificaciones.controller";
import { CorreoPuerto } from "./puertos/correo.puerto";
import { PruebaCorreoPuerto } from "./puertos/prueba-correo.puerto";
import { RegistroEnviosCorreo } from "./puertos/registro-envios.puerto";

interface DependenciasCorreo {
  configuracion: RepositorioConfiguracionInstalacion;
  cifrador: CifradorVariables;
  fabricar: FabricaCorreoSmtp;
}

/**
 * Strategy por modo (SP-17, ADR 0008): en la nube el correo sale siempre por las `SMTP_*`; en
 * autoalojado, por lo que guardó el asistente, leído en cada envío. Un modo nuevo es una fila.
 */
export const CORREO_POR_MODO: Record<ModoInstalacion, (entorno: CorreoPuerto, dependencias: DependenciasCorreo) => CorreoPuerto> = {
  nube: (entorno) => entorno,
  autoalojado: (entorno, { configuracion, cifrador, fabricar }) => new CorreoSegunInstalacion(configuracion, cifrador, entorno, fabricar),
};

@Module({
  imports: [SuscripcionesModule, VariablesModule],
  controllers: [NotificacionesController],
  providers: [
    { provide: FABRICA_CORREO_SMTP, useValue: fabricaCorreoSmtp(transporteNodemailer) },
    {
      provide: CorreoPuerto,
      // SP-18: cada envío deja su resultado en `RegistroEnviosCorreo` (Estado de la 32), también en autoalojado.
      useFactory: (
        modo: ModoInstalacion,
        registro: RegistroEnviosCorreo,
        reloj: Reloj,
        configuracion: RepositorioConfiguracionInstalacion,
        cifrador: CifradorVariables,
        fabricar: FabricaCorreoSmtp,
      ) => {
        const entorno = correoSegun(configuracionCorreoDesde(process.env), transporteNodemailer);
        return new CorreoConRegistro(CORREO_POR_MODO[modo](entorno, { configuracion, cifrador, fabricar }), registro, reloj);
      },
      inject: [MODO_INSTALACION, RegistroEnviosCorreo, Reloj, RepositorioConfiguracionInstalacion, CifradorVariables, FABRICA_CORREO_SMTP],
    },
    { provide: PruebaCorreoPuerto, useFactory: (fabricar: FabricaCorreoSmtp) => new PruebaCorreoSmtp(fabricar), inject: [FABRICA_CORREO_SMTP] },
  ],
  exports: [CorreoPuerto, PruebaCorreoPuerto],
})
export class NotificacionesModule {}
