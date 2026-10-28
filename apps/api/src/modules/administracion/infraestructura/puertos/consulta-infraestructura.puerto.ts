import type { EstadoDespliegue } from "../../../construccion/dominio/estados";

/** Un despliegue en la cola de construcción: encolado o en curso. */
export interface TrabajoEnCola {
  proyecto: string;
  numero: number;
  estado: EstadoDespliegue;
  creado: Date;
  iniciado: Date | null;
}

/** Un proyecto con despliegue activo y la última muestra de su contenedor (si la hay). */
export interface EntornoActivo {
  proyecto: string;
  titular: string;
  estado: EstadoDespliegue;
  muestra: { tomada: Date; cpu: number; memoriaMb: number } | null;
}

export interface LecturaInfraestructura {
  trabajos: TrabajoEnCola[];
  fallidas: number;
  entornos: EntornoActivo[];
  totalProyectos: number;
}

/**
 * Repository de lectura de 27 (CQRS ligero, como `ConsultaUsuariosPuerto`): la cola sale de la
 * tabla `Despliegue`, que el trabajador mantiene al día (el `jobId` de BullMQ es el `despliegueId`).
 */
export abstract class ConsultaInfraestructuraPuerto {
  abstract leer(fallidasDesde: Date): Promise<LecturaInfraestructura>;
}
