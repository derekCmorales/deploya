export interface Proyecto {
  id: string;
  usuarioId: string;
  nombre: string;
  subdominio: string;
  urlRepositorio: string;
  rama: string;
  rutaDockerfile: string;
  puertoInterno: number;
  creado: Date;
}

export interface AltaProyecto {
  url: string;
  rama: string;
  nombre: string;
  puerto: number;
}

export interface CommitFuente {
  sha: string;
  mensaje: string;
  autor: string;
}

export interface ValidacionRepositorio {
  accesible: true;
  urlNormalizada: string;
  ramas: string[];
  commit: CommitFuente;
  dockerfile: string;
  puerto: number;
}