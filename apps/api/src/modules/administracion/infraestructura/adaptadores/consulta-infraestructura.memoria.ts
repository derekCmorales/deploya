import { ConsultaInfraestructuraPuerto, type LecturaInfraestructura } from "../puertos/consulta-infraestructura.puerto";

/** Doble de 27 en memoria: devuelve lo que la prueba le carga y recuerda desde cuándo contó fallidas. */
export class ConsultaInfraestructuraMemoria extends ConsultaInfraestructuraPuerto {
  fallidasDesde: Date | null = null;

  constructor(private readonly lectura: LecturaInfraestructura = { trabajos: [], fallidas: 0, entornos: [], totalProyectos: 0 }) {
    super();
  }

  async leer(fallidasDesde: Date): Promise<LecturaInfraestructura> {
    this.fallidasDesde = fallidasDesde;
    return this.lectura;
  }
}
