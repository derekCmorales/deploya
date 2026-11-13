export interface Proyecto {
  id: string;
  usuarioId: string;
  nombre: string;
  /** Derivado del nombre al crear; único e inmutable. */
  subdominio: string;
  urlRepositorio: string;
  rama: string;
  rutaDockerfile: string;
  puertoInterno: number;
  /** Sobrescribe el `CMD` de la imagen (feat/m5-recursos-datos); `null` o ausente = el de la imagen. */
  comandoInicio?: string | null;
  /** `RUN` de la receta (feat/m3-alta-guiada); `null` o ausente = el de la receta. */
  comandoConstruccion?: string | null;
  creado: Date;
}

export type ProyectoNuevo = Omit<Proyecto, "id" | "creado">;

/** Lo que pide la web en `POST /proyectos` (11d). Sin `puerto` se usa el de `EXPOSE`. */
export interface AltaProyecto {
  url: string;
  rama: string;
  nombre: string;
  /** Relativa al repositorio; sin ella, `Dockerfile` en la raíz. */
  rutaDockerfile?: string;
  puerto?: number;
  /** Paso 11c. Cada entrada trae valor: todavía no hay cifrado previo que conservar. */
  variables?: { clave: string; valor: string }[];
  /** Paso Construcción (feat/m3-alta-guiada). */
  comandoInicio?: string | null;
  comandoConstruccion?: string | null;
  /** Paso Datos: recursos que M5 crea antes del despliegue #1, sin repetir. */
  datos?: TipoRecursoAlta[];
}

/** Los tipos de recurso de datos que el alta puede pedir (recursos-datos.md § Tipos). */
export const TIPOS_RECURSO_ALTA = ["postgres", "redis", "s3"] as const;
export type TipoRecursoAlta = (typeof TIPOS_RECURSO_ALTA)[number];

export interface ConsultaRepositorio {
  url: string;
  rama: string;
  /** Dónde buscar el Dockerfile; sin ella, en la raíz. */
  rutaDockerfile?: string;
}

export interface CommitFuente {
  sha: string;
  mensaje: string;
  autor: string;
  fecha: string;
}

/** Respuesta de `POST /proyectos/validar-repositorio` (11a). */
export interface ValidacionRepositorio {
  accesible: true;
  urlNormalizada: string;
  repositorio: string;
  rama: string;
  ramas: string[];
  commit: CommitFuente;
  /** Ruta que se consultó (`Dockerfile` si no llegó ninguna). */
  rutaDockerfile: string;
  /** `null` si no hay Dockerfile: la receta de M4 decide cómo se construye. */
  dockerfile: string | null;
  /** `EXPOSE` del Dockerfile, el de la receta, o el puerto por defecto. */
  puerto: number;
  /** Lo llena el servicio tras `DeteccionStackService.detectar`. */
  deteccion?: { receta: string; nombre: string; descripcion: string; aplicaComandoConstruccion: boolean };
}
