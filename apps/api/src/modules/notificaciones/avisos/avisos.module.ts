import { Module } from "@nestjs/common";
import { IdentidadModule } from "../../identidad/identidad.module";
import { NotificacionesModule } from "../notificaciones.module";
import { AvisosPuerto } from "../puertos/avisos.puerto";
import { DestinatariosPuerto } from "../puertos/destinatarios.puerto";
import { AvisosCorreo } from "./avisos-correo";
import { CONFIGURACION_AVISOS, configuracionAvisosDesde } from "./configuracion-avisos";
import { DestinatariosDeIdentidad } from "./destinatarios-de-identidad";

/**
 * Exporta `AvisosPuerto` (contrato avisos.md) para el trabajador de despliegues (M4) y el ciclo
 * de suscripciones (M2). Va aparte de `NotificacionesModule` porque necesita a identidad, que
 * ya importa `NotificacionesModule` para el correo de verificación: así no hay ciclo de módulos.
 */
@Module({
  imports: [NotificacionesModule, IdentidadModule],
  providers: [
    { provide: AvisosPuerto, useClass: AvisosCorreo },
    { provide: DestinatariosPuerto, useClass: DestinatariosDeIdentidad },
    { provide: CONFIGURACION_AVISOS, useFactory: () => configuracionAvisosDesde(process.env) },
  ],
  exports: [AvisosPuerto],
})
export class AvisosModule {}
