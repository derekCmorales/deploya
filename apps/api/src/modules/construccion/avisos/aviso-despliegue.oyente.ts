import { Injectable } from "@nestjs/common";
import { AvisosPuerto } from "../../notificaciones";
import type { Despliegue, LineaBitacora } from "../dominio/despliegue";
import { OyenteDespliegue, type DespliegueTerminado } from "../puertos/oyente-despliegue.puerto";
import { ProyectosLecturaPuerto } from "../puertos/proyectos-lectura.puerto";
import { RepositorioDespliegues } from "../puertos/repositorio-despliegues.puerto";
import { LINEAS_AVISO_FALLIDO, avisoDeDespliegue, seAvisa } from "./aviso-despliegue";

/**
 * Observer de `DespliegueTerminado` (SP-08): un Saludable o un Fallido le llega al titular por
 * correo con `AvisosPuerto` (contrato avisos.md). Lo registra `OYENTES_DESPLIEGUE`; el pipeline
 * no sabe de correos y, si este oyente falla, lo registra sin cambiar el estado.
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

  async alTerminar({ proyectoId, despliegueId, estado }: DespliegueTerminado): Promise<void> {
    if (!seAvisa(estado)) return;
    const [despliegue, proyecto] = await Promise.all([this.despliegues.porId(despliegueId), this.proyectos.porId(proyectoId)]);
    if (!despliegue || !proyecto) return;
    const terminado = { ...despliegue, estado };
    const [activo, lineas] = await this.contextoDelFallo(terminado);
    await this.avisos.despliegueTerminado(avisoDeDespliegue({ proyecto, despliegue: terminado, activo, lineas }));
  }

  /** Lo que solo pide un Fallido: la versión que sigue activa y las últimas líneas de la bitácora. */
  private async contextoDelFallo(despliegue: Despliegue): Promise<[Despliegue | null, LineaBitacora[]]> {
    if (despliegue.estado !== "fallido") return [null, []];
    return Promise.all([this.despliegues.activoDe(despliegue.proyectoId), this.despliegues.ultimasLineas(despliegue.id, LINEAS_AVISO_FALLIDO)]);
  }
}
