export type EstadoConstruccion = 
  | 'PENDIENTE' 
  | 'CLONANDO' 
  | 'CONSTRUYENDO' 
  | 'EXITOSO' 
  | 'FALLIDO';

export interface Construccion {
  id: string;
  proyectoId: string;
  estado: EstadoConstruccion;
  logs: string;
  creado: Date;
}