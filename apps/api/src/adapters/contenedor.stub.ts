import { Injectable } from "@nestjs/common";
import { ContenedorPuerto } from "./contenedor.puerto";

@Injectable()
export class ContenedorStub extends ContenedorPuerto {
  async crear(): Promise<{ id: string }> {
    return { id: "contenedor-stub" };
  }
  async detener(): Promise<void> {
    return;
  }
}
