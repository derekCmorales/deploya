import { Injectable, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { ColaMuestreoPuerto } from "./cola-muestreo.puerto";
import { MuestreoMetricas } from "./muestreo-metricas";

/** En el trabajador: al arrancar programa el tick de 60 s y se lo entrega a `MuestreoMetricas`. */
@Injectable()
export class TareaMuestreoMetricas implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    private readonly cola: ColaMuestreoPuerto,
    private readonly muestreo: MuestreoMetricas,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.cola.iniciar(() => this.muestreo.correr());
  }

  async onModuleDestroy(): Promise<void> {
    await this.cola.cerrar();
  }
}
