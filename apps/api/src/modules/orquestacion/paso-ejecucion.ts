import { Injectable } from "@nestjs/common";
import { PasoPipeline, type ContextoDespliegue } from "../construccion/pipeline/paso-pipeline";
import { RepositorioDespliegues } from "../construccion/puertos/repositorio-despliegues.puerto";
import { OrquestacionService } from "./orquestacion.service";

/** Etapa 3 · Ejecución: contenedor con los límites del plan y verificación de salud. */
@Injectable()
export class PasoEjecucion extends PasoPipeline {
  readonly etapa = "ejecucion" as const;
  readonly estado = "aprovisionando" as const;

  constructor(
    private readonly orquestacion: OrquestacionService,
    private readonly despliegues: RepositorioDespliegues,
  ) {
    super();
  }

  async ejecutar(contexto: ContextoDespliegue): Promise<void> {
    const { despliegue, proyecto, bitacora } = contexto;
    const { contenedor, recursos, salud } = await this.orquestacion.aprovisionar({
      proyecto,
      numero: despliegue.numero,
      imagen: contexto.imagen ?? "",
      variables: {},
    });
    contexto.contenedor = contenedor;
    await this.despliegues.cambiarEstado(despliegue.id, this.estado, {
      contenedorId: contenedor.id,
      cpus: recursos.cpus,
      memoriaMb: recursos.memoriaMb,
    });
    bitacora.escribir(this.etapa, `Contenedor iniciado · ${recursos.cpus} vCPU · ${recursos.memoriaMb} MB`);
    bitacora.escribir(this.etapa, `Verificación de salud OK · ${salud.detalle} en ${salud.milisegundos} ms`);
  }

  /** Si falla una etapa posterior, el contenedor nuevo no se queda corriendo. */
  async compensar(contexto: ContextoDespliegue): Promise<void> {
    if (contexto.contenedor) await this.orquestacion.eliminarContenedor(contexto.contenedor.id);
  }
}
