import { Injectable } from "@nestjs/common";
import { PasoPipeline, type ContextoDespliegue } from "../construccion/pipeline/paso-pipeline";
import { RepositorioDespliegues } from "../construccion/puertos/repositorio-despliegues.puerto";
import { OrquestacionService } from "./orquestacion.service";
import { VariablesEntornoPuerto } from "./puertos/variables-entorno.puerto";

/**
 * Etapa 3 · Ejecución: contenedor con los límites del plan y las variables del proyecto
 * (M3-03), y verificación de salud. La bitácora dice cuántas variables, nunca cuáles.
 */
@Injectable()
export class PasoEjecucion extends PasoPipeline {
  readonly etapa = "ejecucion" as const;
  readonly estado = "aprovisionando" as const;

  constructor(
    private readonly orquestacion: OrquestacionService,
    private readonly despliegues: RepositorioDespliegues,
    private readonly variablesEntorno: VariablesEntornoPuerto,
  ) {
    super();
  }

  async ejecutar(contexto: ContextoDespliegue): Promise<void> {
    const { despliegue, proyecto, bitacora } = contexto;
    const variables = await this.variablesEntorno.deProyecto(proyecto.id);
    const { contenedor, recursos, salud } = await this.orquestacion.aprovisionar({
      proyecto,
      numero: despliegue.numero,
      imagen: contexto.imagen ?? "",
      variables,
    });
    contexto.contenedor = contenedor;
    await this.despliegues.cambiarEstado(despliegue.id, this.estado, {
      contenedorId: contenedor.id,
      cpus: recursos.cpus,
      memoriaMb: recursos.memoriaMb,
    });
    bitacora.escribir(this.etapa, `Contenedor iniciado · ${recursos.cpus} vCPU · ${recursos.memoriaMb} MB`);
    const cantidad = Object.keys(variables).length;
    if (cantidad > 0) bitacora.escribir(this.etapa, textoVariables(cantidad));
    bitacora.escribir(this.etapa, `Verificación de salud OK · ${salud.detalle} en ${salud.milisegundos} ms`);
  }

  /** Si falla una etapa posterior, el contenedor nuevo no se queda corriendo. */
  async compensar(contexto: ContextoDespliegue): Promise<void> {
    if (contexto.contenedor) await this.orquestacion.eliminarContenedor(contexto.contenedor.id);
  }
}

export function textoVariables(cantidad: number): string {
  return cantidad === 1 ? "1 variable aplicada" : `${cantidad} variables aplicadas`;
}
