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
  creado: Date;
}

export type ProyectoNuevo = Omit<Proyecto, "id" | "creado">;

/** Lo que pide la web en `POST /proyectos` (11d). Sin `puerto` se usa el de `EXPOSE`. */
export interface AltaProyecto {
  url: string;
  rama: string;
  nombre: string;
  puerto?: number;
}

export interface ConsultaRepositorio {
  url: string;
  rama: string;
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
  dockerfile: string;
  /** `EXPOSE` del Dockerfile o el puerto por defecto. */
  puerto: number;
}