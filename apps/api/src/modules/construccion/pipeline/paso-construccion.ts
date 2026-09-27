import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { DockerfileAusente } from "../dominio/errores";
import { etiquetaImagen, TIEMPO_MAXIMO_CONSTRUCCION_MS } from "../dominio/motor.constantes";
import { ClonadorRepositorioPuerto } from "../puertos/clonador-repositorio.puerto";
import { ConstructorImagenPuerto } from "../puertos/constructor-imagen.puerto";
import { RepositorioArtefactos } from "../puertos/repositorio-artefactos.puerto";
import { RepositorioDespliegues } from "../puertos/repositorio-despliegues.puerto";
import { PasoPipeline, type ContextoDespliegue } from "./paso-pipeline";

const BYTES_POR_MB = 1024 * 1024;

/** Etapa 2 · Construcción: `docker build` con el Dockerfile del repo y registro del artefacto #n. */
@Injectable()
export class PasoConstruccion extends PasoPipeline {
  readonly etapa = "construccion" as const;
  readonly estado = "construyendo" as const;

  constructor(
    private readonly clonador: ClonadorRepositorioPuerto,
    private readonly constructorImagen: ConstructorImagenPuerto,
    private readonly artefactos: RepositorioArtefactos,
    private readonly despliegues: RepositorioDespliegues,
    private readonly reloj: Reloj,
  ) {
    super();
  }

  async ejecutar(contexto: ContextoDespliegue): Promise<void> {
    const { despliegue, proyecto, bitacora } = contexto;
    const directorio = contexto.directorio ?? "";
    if (!(await this.clonador.existeArchivo(directorio, proyecto.rutaDockerfile))) {
      throw new DockerfileAusente(proyecto.rutaDockerfile);
    }
    const etiqueta = etiquetaImagen(proyecto.subdominio, despliegue.numero);
    bitacora.escribir(this.etapa, `Dockerfile encontrado · docker build -t ${etiqueta} .`);
    const imagen = await this.constructorImagen.construir(
      { directorio, rutaDockerfile: proyecto.rutaDockerfile, etiqueta, tiempoMaximoMs: TIEMPO_MAXIMO_CONSTRUCCION_MS },
      (texto) => bitacora.escribir(this.etapa, texto),
    );
    const artefacto = await this.artefactos.registrar({
      proyectoId: proyecto.id,
      numero: despliegue.numero,
      imagen: etiqueta,
      digest: imagen.digest,
      tamanoBytes: imagen.tamanoBytes,
      commitSha: contexto.commit?.sha ?? "",
      receta: "dockerfile",
      creado: this.reloj.ahora(),
    });
    await this.despliegues.cambiarEstado(despliegue.id, this.estado, { artefactoId: artefacto.id });
    contexto.imagen = etiqueta;
    bitacora.escribir(this.etapa, `Imagen lista · ${imagen.digest} (${Math.round(imagen.tamanoBytes / BYTES_POR_MB)} MB)`);
  }
}
