import { Injectable } from "@nestjs/common";
import {
  MuestrasMetricas,
  type Muestra,
  type NuevaMuestra,
} from "../../modules/orquestacion/puertos/muestras-metricas.puerto";

interface Vinculo {
  proyectoId: string;
  version: number;
}

/**
 * Mismo contrato que Prisma. Las pruebas vinculan el despliegue a su proyecto
 * porque la tabla no guarda `proyectoId`: en la base sale del join.
 */
@Injectable()
export class MuestrasMetricasMemoria extends MuestrasMetricas {
  private filas: NuevaMuestra[] = [];
  private readonly vinculos = new Map<string, Vinculo>();

  vincular(despliegueId: string, proyectoId: string, version: number): void {
    this.vinculos.set(despliegueId, { proyectoId, version });
  }

  async guardar(muestra: NuevaMuestra): Promise<void> {
    this.filas.push({ ...muestra, tomada: new Date(muestra.tomada) });
  }

  async deProyecto(proyectoId: string, desde: Date): Promise<Muestra[]> {
    return this.filas
      .filter((fila) => this.vinculos.get(fila.despliegueId)?.proyectoId === proyectoId && fila.tomada >= desde)
      .sort((a, b) => a.tomada.getTime() - b.tomada.getTime())
      .map((fila) => this.conVersion(fila));
  }

  async purgarAntesDe(fecha: Date): Promise<number> {
    const antes = this.filas.length;
    this.filas = this.filas.filter((fila) => fila.tomada >= fecha);
    return antes - this.filas.length;
  }

  private conVersion(fila: NuevaMuestra): Muestra {
    return { ...fila, version: this.vinculos.get(fila.despliegueId)?.version ?? 0 };
  }
}
