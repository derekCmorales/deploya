import {
  MetricasContenedorPuerto,
  type MuestraContenedor,
} from "../../modules/orquestacion/puertos/metricas-contenedor.puerto";

/** Doble en memoria del mismo contrato que `MetricasDockerStats`. */
export class MetricasContenedorStub extends MetricasContenedorPuerto {
  readonly pedidos: string[] = [];
  muestraDe: MuestraContenedor = { cpu: 0.12, memoriaMb: 430 };

  async muestra(contenedorId: string): Promise<MuestraContenedor> {
    this.pedidos.push(contenedorId);
    return this.muestraDe;
  }
}
