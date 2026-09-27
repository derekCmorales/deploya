import { Injectable } from "@nestjs/common";
import { PasoPipeline, type ContextoDespliegue } from "../construccion/pipeline/paso-pipeline";
import { RepositorioDespliegues } from "../construccion/puertos/repositorio-despliegues.puerto";
import { EnrutamientoService } from "./enrutamiento.service";

/** Etapa 4 · Enrutamiento: el subdominio apunta al contenedor que ya pasó la salud. */
@Injectable()
export class PasoEnrutamiento extends PasoPipeline {
  readonly etapa = "enrutamiento" as const;
  readonly estado = "publicando" as const;

  constructor(
    private readonly enrutamiento: EnrutamientoService,
    private readonly despliegues: RepositorioDespliegues,
  ) {
    super();
  }

  async ejecutar(contexto: ContextoDespliegue): Promise<void> {
    const { despliegue, proyecto, bitacora, contenedor } = contexto;
    const url = await this.enrutamiento.publicar({
      subdominio: proyecto.subdominio,
      host: contenedor?.host ?? "",
      puerto: proyecto.puertoInterno,
    });
    contexto.url = url;
    await this.despliegues.cambiarEstado(despliegue.id, this.estado, { url });
    bitacora.escribir(this.etapa, `${url} → #${despliegue.numero}`);
  }
}
