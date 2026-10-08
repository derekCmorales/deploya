import { Construccion, EstadoConstruccion } from '../dominio/construccion';

export abstract class RepositorioConstruccion {
  abstract iniciar(proyectoId: string): Promise<Construccion>;
  abstract actualizarEstado(id: string, estado: EstadoConstruccion, logsAdicionales?: string): Promise<void>;
  abstract porId(id: string): Promise<Construccion | null>;
  abstract deProyecto(proyectoId: string): Promise<Construccion[]>;
  abstract ultimosDeProyectos(proyectosIds: string[]): Promise<Record<string, unknown>>;
}