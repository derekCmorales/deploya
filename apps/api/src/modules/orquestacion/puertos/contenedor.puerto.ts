export interface EspecContenedor {
  nombre: string;
  imagen: string;
  red: string;
  puertoInterno: number;
  cpus: number;
  memoriaMb: number;
  variables: Record<string, string>;
}

export interface ContenedorCreado {
  id: string;
  /** Nombre por el que Traefik y el trabajador lo alcanzan en la red del proyecto. */
  host: string;
}

/** Puerto DIP — la API no llama a Docker. Sin prefijo I. */
export abstract class ContenedorPuerto {
  abstract crear(espec: EspecContenedor): Promise<ContenedorCreado>;
  abstract detener(contenedorId: string): Promise<void>;
  abstract eliminar(contenedorId: string): Promise<void>;
}
