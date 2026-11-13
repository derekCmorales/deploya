import type { DockerfileReceta } from "../dockerfile-receta";
import { DecoradorDockerfile } from "./decorador-dockerfile";

/** `USER` final sin privilegios, para las recetas cuya base no fija el suyo; encaja con `CapDrop: ALL` de M5. */
export class ConUsuarioSinPrivilegios extends DecoradorDockerfile {
  constructor(
    dockerfile: DockerfileReceta,
    private readonly usuario: string,
  ) {
    super(dockerfile);
  }

  instrucciones(): readonly string[] {
    return [...super.instrucciones(), `USER ${this.usuario}`];
  }

  descripcion(): string {
    return `${super.descripcion()} · usuario ${this.usuario}`;
  }
}
