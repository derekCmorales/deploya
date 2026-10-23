/**
 * Component del Decorator: el `Dockerfile.deploya` de una receta. Lo responden tanto la
 * base como cualquier pila de capas, así que el cliente no distingue una de otra.
 */
export interface DockerfileReceta {
  instrucciones(): readonly string[];
  /** «Go 1.23 · puerto 8080 · usuario nonroot:nonroot», para la bitácora. */
  descripcion(): string;
}

/** ConcreteComponent: solo lo propio del stack, sin las capas comunes. */
export class DockerfileBase implements DockerfileReceta {
  constructor(
    private readonly nombre: string,
    private readonly lineas: readonly string[],
  ) {}

  instrucciones(): readonly string[] {
    return this.lineas;
  }

  descripcion(): string {
    return this.nombre;
  }
}

/** El texto que se escribe como `Dockerfile.deploya`. */
export function textoDockerfile(dockerfile: DockerfileReceta): string {
  return `${dockerfile.instrucciones().join("\n")}\n`;
}
