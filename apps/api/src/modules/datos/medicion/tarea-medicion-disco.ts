import { Injectable, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { MotorDatosService } from "../motor-datos.service";
import { ColaMedicionDiscoPuerto } from "./cola-medicion.puerto";

/** En el trabajador: al arrancar programa el tick de medición y se lo entrega a `MotorDatosService`. */
@Injectable()
export class TareaMedicionDisco implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    private readonly cola: ColaMedicionDiscoPuerto,
    private readonly motor: MotorDatosService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.cola.iniciar(() => this.motor.medirDiscos());
  }

  async onModuleDestroy(): Promise<void> {
    await this.cola.cerrar();
  }
}
