/** Quién puede crear una cuenta en una instalación autoalojada (SP-18). */
export type PoliticaRegistro = "abierto" | "invitacion" | "cerrado";

export const POLITICA_POR_DEFECTO: PoliticaRegistro = "invitacion";

/** Una sola fila (`id = instalacion`), datos-nucleo.md v2. Solo existe en autoalojado. */
export interface LimitesInstalacion {
  cpuPorProyecto: number;
  memoriaMbPorProyecto: number;
  /** `null` = sin límite de proyectos por usuario. */
  proyectosPorUsuario: number | null;
}

/** Los valores por defecto de la columna: 1 vCPU y 1 GB por proyecto, sin límite de proyectos. */
export const LIMITES_POR_DEFECTO: LimitesInstalacion = { cpuPorProyecto: 1, memoriaMbPorProyecto: 1024, proyectosPorUsuario: null };

export interface CodigoConfiguracion {
  hashCodigo: string;
  codigoVence: Date;
}

/** La clave de la fila única. */
export const ID_INSTALACION = "instalacion";
