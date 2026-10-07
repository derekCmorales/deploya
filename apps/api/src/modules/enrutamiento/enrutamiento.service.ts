import { Injectable } from "@nestjs/common";
import { EnrutamientoFallido } from "../construccion/dominio/errores";
import { EnrutamientoPuerto, type RutaPublica } from "./puertos/enrutamiento.puerto";

/** M6: publica el subdominio del proyecto hacia su contenedor vía el enrutador de borde. */
@Injectable()
export class EnrutamientoService {
  constructor(private readonly enrutamiento: EnrutamientoPuerto) {}

  async publicar(ruta: RutaPublica): Promise<string> {
    try {
      const { url } = await this.enrutamiento.publicar(ruta);
      return url;
    } catch (error) {
      throw new EnrutamientoFallido(error instanceof Error ? error.message : String(error));
    }
  }

  /** Detener y eliminar quitan la ruta: el subdominio responde 404 de Traefik y no 502. */
  async retirar(subdominio: string): Promise<void> {
    await this.enrutamiento.retirar(subdominio);
  }
}
