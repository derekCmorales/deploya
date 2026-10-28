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

/** Una línea de la salida del contenedor (`docker logs --timestamps`), sin nivel: eso lo decide M7. */
export interface LineaSalida {
  marca: Date;
  texto: string;
}

export interface ConsultaSalida {
  /** Solo lo posterior a esta marca; `null` = desde el principio. */
  desde: Date | null;
  /** Las últimas `max` líneas (SP-12: 500). */
  max: number;
}

/** Puerto DIP — la API no llama a Docker. Sin prefijo I. */
export abstract class ContenedorPuerto {
  abstract crear(espec: EspecContenedor): Promise<ContenedorCreado>;
  /** Arranca un contenedor existente (reiniciar sin reconstruir). */
  abstract iniciar(contenedorId: string): Promise<void>;
  abstract detener(contenedorId: string): Promise<void>;
  abstract eliminar(contenedorId: string): Promise<void>;
  /** Detiene y borra todos los contenedores del proyecto; no falla si ya no hay. */
  abstract eliminarContenedoresDe(subdominio: string): Promise<void>;
  /** Borra una imagen por su etiqueta (retención de artefactos, M5-04); no falla si ya no existe. */
  abstract eliminarImagen(imagen: string): Promise<void>;
  /** Borra las imágenes `deploya/<subdominio>:*`; no falla si ya no hay. */
  abstract eliminarImagenesDe(subdominio: string): Promise<void>;
  /** Salida del contenedor (SP-12): se lee de Docker, deploya no la guarda. */
  abstract bitacora(contenedorId: string, consulta: ConsultaSalida): Promise<LineaSalida[]>;
}
