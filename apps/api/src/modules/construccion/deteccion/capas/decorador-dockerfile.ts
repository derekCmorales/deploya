import type { DockerfileReceta } from "../dockerfile-receta";

/**
 * Base Decorator: guarda cualquier `DockerfileReceta` (la base u otra capa) y le delega.
 * Por sí sola no agrega nada; cada capa concreta extiende esta clase y suma lo suyo.
 */
export abstract class DecoradorDockerfile implements DockerfileReceta {
  constructor(protected readonly wrappee: DockerfileReceta) {}

  instrucciones(): readonly string[] {
    return this.wrappee.instrucciones();
  }

  descripcion(): string {
    return this.wrappee.descripcion();
  }
}
