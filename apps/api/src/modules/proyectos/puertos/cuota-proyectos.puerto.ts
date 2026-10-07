<<<<<<< HEAD
export abstract class CuotaProyectosPuerto {
  abstract maxProyectosDe(usuarioId: string): Promise<number>;
}
=======
/** Lo que M3 necesita de `cuotaDe` de M2: el límite de proyectos y los recursos que muestra 10/11. */
export interface CuotaProyectos {
  plan: string;
  maxProyectos: number;
  cpus: number;
  memoriaMb: number;
}

/**
 * Puerto estrecho sobre `SuscripcionesService.cuotaDe` (M2). El adaptador real lo
 * envuelve cuando M2 exporte el servicio.
 */
export abstract class CuotaProyectosPuerto {
  abstract cuotaDe(usuarioId: string): Promise<CuotaProyectos>;
}
>>>>>>> origin/main
