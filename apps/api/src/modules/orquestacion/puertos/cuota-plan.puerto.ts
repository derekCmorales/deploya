import type { EstadoSuscripcion } from "../dominio/politica-despliegue";

/** Los recursos del plan que aplica el motor (subconjunto de `Cuota` de M2). */
export interface RecursosPlan {
  plan: string;
  cpus: number;
  memoriaMb: number;
}

/** Lo que decide si se puede construir (M5-03). */
export interface PermisoPlan {
  estado: EstadoSuscripcion;
  construccionesMes: number;
}

/**
 * Puerto estrecho sobre `SuscripcionesService.cuotaDe` (M2). El adaptador real lo
 * envuelve cuando M2 exporte el servicio; el motor no conoce el resto de la cuota.
 */
export abstract class CuotaPlanPuerto {
  abstract recursosDe(usuarioId: string): Promise<RecursosPlan>;
  abstract permisoDe(usuarioId: string): Promise<PermisoPlan>;
}
