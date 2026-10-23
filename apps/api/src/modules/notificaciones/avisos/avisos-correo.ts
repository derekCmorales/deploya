import { Inject, Injectable, Logger } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { commitCorto, diasHasta, duracionLegible, fechaAviso, hostDe } from "../dominio/formato-aviso";
import type { PlantillaCorreo } from "../dominio/plantilla-correo";
import {
  PLANTILLA_DESPLIEGUE_FALLIDO,
  PLANTILLA_DESPLIEGUE_SALUDABLE,
  PLANTILLA_PLAN_POR_VENCER,
  PLANTILLA_SUSCRIPCION_SUSPENDIDA,
} from "../dominio/plantillas-avisos";
import { AvisosPuerto, type AvisoDespliegue, type AvisoSuscripcion } from "../puertos/avisos.puerto";
import { CorreoPuerto } from "../puertos/correo.puerto";
import { DestinatariosPuerto } from "../puertos/destinatarios.puerto";
import { CONFIGURACION_AVISOS, type ConfiguracionAvisos } from "./configuracion-avisos";

const RUTA_SUSCRIPCION = "/suscripcion";

/**
 * Adapter + Facade de `AvisosPuerto` (contrato avisos.md): busca al titular, arma la plantilla
 * de 24b y la manda por `CorreoPuerto`. Cualquier fallo (cuenta inexistente, SMTP caído) se
 * registra y la promesa se resuelve: el despliegue y el ciclo siguen igual.
 */
@Injectable()
export class AvisosCorreo extends AvisosPuerto {
  private readonly registro = new Logger(AvisosCorreo.name);

  constructor(
    private readonly destinatarios: DestinatariosPuerto,
    private readonly correo: CorreoPuerto,
    private readonly reloj: Reloj,
    @Inject(CONFIGURACION_AVISOS) private readonly configuracion: ConfiguracionAvisos,
  ) {
    super();
  }

  async despliegueTerminado(aviso: AvisoDespliegue): Promise<void> {
    const { proyecto, despliegue } = aviso;
    const rutaProyecto = `${this.configuracion.urlWeb}/projects/${encodeURIComponent(proyecto.id)}`;
    if (despliegue.estado === "saludable") {
      const url = aviso.url ?? rutaProyecto;
      await this.enviarA(aviso.usuarioId, PLANTILLA_DESPLIEGUE_SALUDABLE, {
        enlace: url,
        proyecto: proyecto.nombre,
        numero: despliegue.numero,
        commit: commitCorto(despliegue.commit),
        duracion: duracionLegible(despliegue.duracionMs),
        host: hostDe(url),
      });
      return;
    }
    await this.enviarA(aviso.usuarioId, PLANTILLA_DESPLIEGUE_FALLIDO, {
      enlace: `${rutaProyecto}/despliegues/${despliegue.numero}`,
      proyecto: proyecto.nombre,
      numero: despliegue.numero,
      etapa: aviso.fallo?.etapa ?? "el despliegue",
      versionActiva: aviso.fallo?.versionActiva ?? null,
      ultimasLineas: aviso.fallo?.ultimasLineas ?? [],
    });
  }

  async suscripcionCambio(aviso: AvisoSuscripcion): Promise<void> {
    const enlace = `${this.configuracion.urlWeb}${RUTA_SUSCRIPCION}`;
    if (aviso.estado === "suspendida") {
      await this.enviarA(aviso.usuarioId, PLANTILLA_SUSCRIPCION_SUSPENDIDA, {
        enlace,
        contenedoresDetenidos: aviso.contenedoresDetenidos ?? 0,
      });
      return;
    }
    if (!aviso.venceEl) {
      this.registro.warn(`Aviso de Por vencer sin fecha para ${aviso.usuarioId}; no se envía`);
      return;
    }
    await this.enviarA(aviso.usuarioId, PLANTILLA_PLAN_POR_VENCER, {
      enlace,
      plan: aviso.plan,
      dias: diasHasta(aviso.venceEl, this.reloj.ahora()),
      venceEl: fechaAviso(aviso.venceEl),
      vigencia: aviso.vigenciaDias ? `${aviso.vigenciaDias} días` : null,
      precio: aviso.precio ?? null,
    });
  }

  /** Regla 1 del contrato: nada de lo que pase aquí llega a quien avisa. */
  private async enviarA<D extends { enlace: string }>(usuarioId: string, plantilla: PlantillaCorreo<D>, datos: D): Promise<void> {
    try {
      const destinatario = await this.destinatarios.destinatarioDe(usuarioId);
      if (!destinatario) {
        this.registro.warn(`Aviso sin destinatario: la cuenta ${usuarioId} no existe`);
        return;
      }
      await this.correo.enviar(destinatario.correo, plantilla, datos);
    } catch (error) {
      this.registro.warn(`Aviso sin enviar a ${usuarioId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
