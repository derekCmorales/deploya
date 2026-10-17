import { Injectable } from "@nestjs/common";
import { EnrutamientoPuerto, type RutaPublica } from "../../modules/enrutamiento/puertos/enrutamiento.puerto";

@Injectable()
export class EnrutamientoStub extends EnrutamientoPuerto {
  readonly publicadas: RutaPublica[] = [];
  /** Cómo escribe la URL el stub (`http://<subdominio>.localhost` salvo que una prueba pida otra cosa). */
  dominioBase = "localhost";
  esquema = "http";
  readonly retiradas: string[] = [];
  error: Error | null = null;

  async publicar(ruta: RutaPublica): Promise<{ url: string }> {
    if (this.error) throw this.error;
    this.publicadas.push(ruta);
    return { url: `${this.esquema}://${ruta.subdominio}.${this.dominioBase}` };
  }

  async retirar(subdominio: string): Promise<void> {
    this.retiradas.push(subdominio);
  }
}
