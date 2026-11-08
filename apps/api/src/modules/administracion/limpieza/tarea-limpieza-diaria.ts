import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from "@nestjs/common";
import { ColaLimpiezaPuerto } from "./cola-limpieza.puerto";
import { LimpiezaService } from "./limpieza.service";

/** En el trabajador: al arrancar programa la limpieza diaria (00:35 UTC) y la entrega al servicio. */
@Injectable()
export class TareaLimpiezaDiaria implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly registro = new Logger(TareaLimpiezaDiaria.name);

  constructor(
    private readonly cola: ColaLimpiezaPuerto,
    private readonly limpieza: LimpiezaService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.cola.iniciar(() => this.correr());
  }

  async onModuleDestroy(): Promise<void> {
    await this.cola.cerrar();
  }

  private async correr(): Promise<void> {
    const { filas } = await this.limpieza.ejecutar();
    this.registro.log(`Limpieza diaria: ${filas.total} filas (${filas.tokens} tokens, ${filas.sesiones} sesiones, ${filas.invitaciones} invitaciones)`);
  }
}
