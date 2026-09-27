import { Injectable } from "@nestjs/common";
import { PasoPipeline, type ContextoDespliegue } from "../construccion/pipeline/paso-pipeline";
import { RepositorioDespliegues } from "../construccion/puertos/repositorio-despliegues.puerto";
import { OrquestacionService } from "./orquestacion.service";

/**
 * Etapa 5 · Operación: el despliegue nuevo pasa a ser el activo y solo después se
 * detiene el anterior (conmutación sin corte).
 */
@Injectable()
export class PasoOperacion extends PasoPipeline {
  readonly etapa = "operacion" as const;
  readonly estado = "publicando" as const;

  constructor(
    private readonly orquestacion: OrquestacionService,
    private readonly despliegues: RepositorioDespliegues,
  ) {
    super();
  }

  async ejecutar(contexto: ContextoDespliegue): Promise<void> {
    const { despliegue, proyecto, bitacora } = contexto;
    const anterior = await this.despliegues.activoDe(proyecto.id);
    await this.despliegues.marcarActivo(proyecto.id, despliegue.id);
    if (anterior?.contenedorId && anterior.id !== despliegue.id) {
      await this.orquestacion.detenerContenedor(anterior.contenedorId);
      bitacora.escribir(this.etapa, `Contenedor #${anterior.numero} detenido · #${despliegue.numero} atiende el tráfico`);
      return;
    }
    bitacora.escribir(this.etapa, `#${despliegue.numero} atiende el tráfico`);
  }
}
