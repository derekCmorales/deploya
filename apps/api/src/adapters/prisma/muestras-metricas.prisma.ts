import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../compartido/prisma/prisma.service";
import {
  MuestrasMetricas,
  type Muestra,
  type NuevaMuestra,
} from "../../modules/orquestacion/puertos/muestras-metricas.puerto";

/** `MuestraMetrica` en PostgreSQL. La purga usa el índice de `tomada`. */
@Injectable()
export class MuestrasMetricasPrisma extends MuestrasMetricas {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async guardar(muestra: NuevaMuestra): Promise<void> {
    await this.prisma.muestraMetrica.create({ data: muestra });
  }

  async deProyecto(proyectoId: string, desde: Date): Promise<Muestra[]> {
    const filas = await this.prisma.muestraMetrica.findMany({
      where: { tomada: { gte: desde }, despliegue: { proyectoId } },
      include: { despliegue: { select: { numero: true } } },
      orderBy: { tomada: "asc" },
    });
    return filas.map((fila) => ({
      despliegueId: fila.despliegueId,
      tomada: fila.tomada,
      cpu: fila.cpu.toNumber(),
      memoriaMb: fila.memoriaMb,
      version: fila.despliegue.numero,
    }));
  }

  async purgarAntesDe(fecha: Date): Promise<number> {
    const borradas = await this.prisma.muestraMetrica.deleteMany({ where: { tomada: { lt: fecha } } });
    return borradas.count;
  }
}
