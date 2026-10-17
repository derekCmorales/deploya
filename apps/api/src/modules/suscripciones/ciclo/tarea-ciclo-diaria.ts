import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { CicloSuscripcionService } from "./ciclo-suscripcion.service";
import { ColaCicloPuerto } from "./cola-ciclo.puerto";

/** En el trabajador: al arrancar programa la corrida diaria (00:05 UTC) y la entrega al servicio. */
@Injectable()
export class TareaCicloDiaria implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly registro = new Logger(TareaCicloDiaria.name);

  constructor(
    private readonly cola: ColaCicloPuerto,
    private readonly ciclo: CicloSuscripcionService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.cola.iniciar(() => this.correr());
  }

  async onModuleDestroy(): Promise<void> {
    await this.cola.cerrar();
  }

  private async correr(): Promise<void> {
    const { cambios } = await this.ciclo.ejecutar();
    this.registro.log(`Ciclo §4.4: ${cambios.length} suscripciones cambiaron de estado`);
  }
}
