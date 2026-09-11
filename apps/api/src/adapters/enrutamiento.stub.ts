import { Injectable } from "@nestjs/common";
import { EnrutamientoPuerto } from "./enrutamiento.puerto";

@Injectable()
export class EnrutamientoStub extends EnrutamientoPuerto {
  async publicar(): Promise<{ certificado: boolean }> {
    return { certificado: false };
  }
}
