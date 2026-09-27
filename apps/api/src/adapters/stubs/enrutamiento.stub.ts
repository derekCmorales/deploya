import { Injectable } from "@nestjs/common";
import { EnrutamientoPuerto, type RutaPublica } from "../../modules/enrutamiento/puertos/enrutamiento.puerto";

@Injectable()
export class EnrutamientoStub extends EnrutamientoPuerto {
  readonly publicadas: RutaPublica[] = [];
  error: Error | null = null;

  async publicar(ruta: RutaPublica): Promise<{ url: string }> {
    if (this.error) throw this.error;
    this.publicadas.push(ruta);
    return { url: `http://${ruta.subdominio}.localhost` };
  }

  async retirar(): Promise<void> {
    return;
  }
}
