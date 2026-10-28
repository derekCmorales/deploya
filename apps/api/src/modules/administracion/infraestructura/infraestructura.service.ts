import { Injectable } from "@nestjs/common";
import { Reloj } from "../../../compartido/reloj";
import { VENTANA_FALLIDAS_MS, vistaInfraestructura, type VistaInfraestructura } from "./dominio/infraestructura";
import { ConsultaInfraestructuraPuerto } from "./puertos/consulta-infraestructura.puerto";
import { MetricasNodoPuerto } from "./puertos/metricas-nodo.puerto";

/** Facade de lectura de Admin · Infraestructura (SP-13): junta nodo, cola y muestras. Solo observa. */
@Injectable()
export class InfraestructuraService {
  constructor(
    private readonly nodo: MetricasNodoPuerto,
    private readonly consulta: ConsultaInfraestructuraPuerto,
    private readonly reloj: Reloj,
  ) {}

  async leer(): Promise<VistaInfraestructura> {
    const ahora = this.reloj.ahora();
    const [nodo, lectura] = await Promise.all([
      this.nodo.nodo(),
      this.consulta.leer(new Date(ahora.getTime() - VENTANA_FALLIDAS_MS)),
    ]);
    return vistaInfraestructura(nodo, lectura, ahora);
  }
}
