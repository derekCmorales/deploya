/** Resuelve un nombre a IPv4 (comprobación del comodín de la 32). Sin respuesta → `[]`. */
export abstract class ResolutorDnsPuerto {
  abstract ipv4(nombre: string): Promise<string[]>;
}
