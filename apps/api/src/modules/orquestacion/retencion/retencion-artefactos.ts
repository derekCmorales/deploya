import { Injectable, Logger } from "@nestjs/common";
import { RepositorioArtefactos } from "../../construccion/puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "../../construccion/puertos/repositorio-despliegues.puerto";
import { OyenteDespliegue, type DespliegueTerminado } from "../../construccion/puertos/oyente-despliegue.puerto";
import { PoliticaRetencion } from "../dominio/politica-retencion";
import { OrquestacionService } from "../orquestacion.service";

/**
 * Observer de `DespliegueTerminado` (M5-04): tras un despliegue Saludable conserva los 5
 * artefactos más recientes y el activo, y borra la imagen del resto. Un fallo al borrar una
 * imagen se registra y se reintenta en la próxima retención; el despliegue no se entera.
 */
@Injectable()
export class RetencionArtefactos extends OyenteDespliegue {
  private readonly registro = new Logger(RetencionArtefactos.name);

  constructor(
    private readonly artefactos: RepositorioArtefactos,
    private readonly despliegues: RepositorioDespliegues,
    private readonly orquestacion: OrquestacionService,
  ) {
    super();
  }

  async alTerminar({ proyectoId, estado }: DespliegueTerminado): Promise<void> {
    if (estado !== "saludable") return;
    const [disponibles, activo] = await Promise.all([this.artefactos.disponiblesDe(proyectoId), this.despliegues.activoDe(proyectoId)]);
    for (const artefacto of PoliticaRetencion.aRetirar(disponibles, activo?.artefactoId ?? null)) {
      try {
        await this.orquestacion.eliminarImagen(artefacto.imagen);
        await this.artefactos.marcarNoDisponible(artefacto.id);
      } catch (error) {
        this.registro.warn(`No se pudo retirar ${artefacto.imagen}: ${String(error)}`);
      }
    }
  }
}
