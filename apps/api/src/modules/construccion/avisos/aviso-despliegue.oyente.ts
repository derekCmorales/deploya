import { Injectable } from "@nestjs/common";
import { AvisosPuerto } from "../../notificaciones";
import { OyenteDespliegue, type DespliegueTerminado } from "../puertos/oyente-despliegue.puerto";
import { ProyectosLecturaPuerto } from "../puertos/proyectos-lectura.puerto";
import { RepositorioDespliegues } from "../puertos/repositorio-despliegues.puerto";
import { avisoDeDespliegue, esAvisable, LINEAS_EN_AVISO, type HechosDespliegue } from "./aviso-despliegue";

/**
 * Observer de `DespliegueTerminado` (SP-08): un oyente más en `OYENTES_DESPLIEGUE`, sin `if` nuevos
 * en el pipeline. Saludable y Fallido mandan su correo por `AvisosPuerto`; Cancelado y Detenido no.
 * Si algo falla, el pipeline lo registra y el estado del despliegue no cambia.
 */
@Injectable()
export class AvisoDespliegueOyente extends OyenteDespliegue {
  constructor(
    private readonly despliegues: RepositorioDespliegues,
    private readonly proyectos: ProyectosLecturaPuerto,
    private readonly avisos: AvisosPuerto,
  ) {
    super();
  }

  async alTerminar({ despliegueId, estado }: DespliegueTerminado): Promise<void> {
    if (!esAvisable(estado)) return;
    const despliegue = await this.despliegues.porId(despliegueId);
    const proyecto = despliegue ? await this.proyectos.porId(despliegue.proyectoId) : null;
    if (!despliegue || !proyecto) return;

    const hechos: HechosDespliegue = { despliegue, proyecto, estado };
    if (estado === "fallido") {
      const [activo, lineas] = await Promise.all([this.despliegues.activoDe(proyecto.id), this.despliegues.ultimasLineas(despliegue.id, LINEAS_EN_AVISO)]);
      hechos.versionActiva = activo?.numero ?? null;
      hechos.ultimasLineas = lineas;
    }
    await this.avisos.despliegueTerminado(avisoDeDespliegue(hechos));
  }
}
