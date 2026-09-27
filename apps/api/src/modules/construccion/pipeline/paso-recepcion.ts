import { Injectable } from "@nestjs/common";
import { ClonadorRepositorioPuerto } from "../puertos/clonador-repositorio.puerto";
import { RepositorioDespliegues } from "../puertos/repositorio-despliegues.puerto";
import { PasoPipeline, type ContextoDespliegue } from "./paso-pipeline";

const LARGO_SHA_CORTO = 7;

/** Etapa 1 · Recepción: clona la rama y registra el commit. */
@Injectable()
export class PasoRecepcion extends PasoPipeline {
  readonly etapa = "recepcion" as const;
  readonly estado = "construyendo" as const;

  constructor(
    private readonly clonador: ClonadorRepositorioPuerto,
    private readonly despliegues: RepositorioDespliegues,
  ) {
    super();
  }

  async ejecutar(contexto: ContextoDespliegue): Promise<void> {
    const { despliegue, proyecto, bitacora } = contexto;
    bitacora.escribir(this.etapa, `Clonando ${proyecto.urlRepositorio} (${despliegue.rama})`);
    const clon = await this.clonador.clonar({
      url: proyecto.urlRepositorio,
      rama: despliegue.rama,
      despliegueId: despliegue.id,
    });
    contexto.directorio = clon.directorio;
    contexto.commit = clon.commit;
    await this.despliegues.cambiarEstado(despliegue.id, this.estado, { commit: clon.commit });
    bitacora.escribir(this.etapa, `Commit ${clon.commit.sha.slice(0, LARGO_SHA_CORTO)} · ${clon.commit.mensaje}`);
  }

  async liberar(contexto: ContextoDespliegue): Promise<void> {
    if (contexto.directorio) await this.clonador.limpiar(contexto.directorio);
  }
}
