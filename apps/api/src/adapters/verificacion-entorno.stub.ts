import { Injectable } from "@nestjs/common";
import { VerificacionEntornoPuerto } from "./verificacion-entorno.puerto";

@Injectable()
export class VerificacionEntornoStub extends VerificacionEntornoPuerto {
  async saludable(): Promise<boolean> {
    return false;
  }
}
