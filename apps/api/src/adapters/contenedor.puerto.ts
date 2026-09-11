/** Puerto DIP — la API no llama a Docker. Sin prefijo I. */
export abstract class ContenedorPuerto {
  abstract crear(opts: {
    imagen: string;
    cpu: number;
    memoriaMb: number;
  }): Promise<{ id: string }>;
  abstract detener(id: string): Promise<void>;
}
