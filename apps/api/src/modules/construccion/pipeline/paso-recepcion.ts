import { Injectable } from "@nestjs/common";
import { DeteccionStackService, type ResultadoDeteccion } from "../deteccion/deteccion-stack.service";
import { DOCKERFILE_GENERADO } from "../deteccion/deteccion.constantes";
import { DeteccionFallida, StackNoReconocido } from "../dominio/errores";
import { ClonadorRepositorioPuerto } from "../puertos/clonador-repositorio.puerto";
import { RecetaProyectoPuerto } from "../puertos/receta-proyecto.puerto";
import { RepositorioDespliegues } from "../puertos/repositorio-despliegues.puerto";
import { PasoPipeline, type ContextoDespliegue } from "./paso-pipeline";

const LARGO_SHA_CORTO = 7;

/**
 * Etapa 1 · Recepción: clona la rama, registra el commit y detecta el stack (M4-03).
 * Con receta, deja `Dockerfile.deploya` en el clon para Construcción.
 */
@Injectable()
export class PasoRecepcion extends PasoPipeline {
  readonly etapa = "recepcion" as const;
  readonly estado = "construyendo" as const;

  constructor(
    private readonly clonador: ClonadorRepositorioPuerto,
    private readonly despliegues: RepositorioDespliegues,
    private readonly deteccion: DeteccionStackService,
    private readonly recetas: RecetaProyectoPuerto,
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
    await this.prepararConstruccion(contexto, await this.detectar(contexto));
  }

  async liberar(contexto: ContextoDespliegue): Promise<void> {
    if (contexto.directorio) await this.clonador.limpiar(contexto.directorio);
  }

  private async detectar(contexto: ContextoDespliegue): Promise<ResultadoDeteccion> {
    try {
      return await this.deteccion.detectar(this.clonador.lector(contexto.directorio ?? ""), contexto.proyecto.rutaDockerfile);
    } catch (error) {
      if (error instanceof StackNoReconocido) throw new DeteccionFallida(error);
      throw error;
    }
  }

  private async prepararConstruccion(contexto: ContextoDespliegue, deteccion: ResultadoDeteccion): Promise<void> {
    const { proyecto, bitacora } = contexto;
    contexto.receta = deteccion.receta;
    contexto.rutaDockerfile = proyecto.rutaDockerfile;
    if (deteccion.dockerfile !== null) {
      await this.clonador.escribir(contexto.directorio ?? "", DOCKERFILE_GENERADO, deteccion.dockerfile);
      contexto.rutaDockerfile = DOCKERFILE_GENERADO;
      bitacora.escribir(this.etapa, `Stack detectado: ${deteccion.nombre} · receta Deploya`);
    } else {
      bitacora.escribir(this.etapa, `Dockerfile detectado (${proyecto.rutaDockerfile})`);
    }
    await this.recetas.registrar(proyecto.id, deteccion.receta);
  }
}
