import type { DockerfileReceta } from "../dockerfile-receta";
import { DecoradorDockerfile } from "./decorador-dockerfile";

const CARACTERES_A_ESCAPAR = /["\\]/g;

/** Un `LABEL clave="valor"`. La misma capa se aplica una vez por etiqueta. */
export class ConEtiqueta extends DecoradorDockerfile {
  constructor(
    dockerfile: DockerfileReceta,
    private readonly clave: string,
    private readonly valor: string,
  ) {
    super(dockerfile);
  }

  instrucciones(): readonly string[] {
    return [...super.instrucciones(), `LABEL ${this.clave}="${this.valor.replace(CARACTERES_A_ESCAPAR, "\\$&")}"`];
  }

  /** «etiqueta revision» para `org.opencontainers.image.revision`. */
  descripcion(): string {
    return `${super.descripcion()} · etiqueta ${this.clave.split(".").at(-1)}`;
  }
}
