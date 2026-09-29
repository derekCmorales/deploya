export class UrlRepositorioInvalida extends Error {
  readonly codigo = "url-invalida";
  constructor(mensaje: string = "La URL del repositorio no es válida.") {
    super(mensaje);
    this.name = "UrlRepositorioInvalida";
  }
}

export class DatosAltaInvalidos extends Error {
  readonly codigo = "datos-invalidos";
  constructor(mensaje: string = "Los datos de alta son inválidos.") {
    super(mensaje);
    this.name = "DatosAltaInvalidos";
  }
}

export class RepositorioNoAccesible extends Error {
  readonly codigo = "repositorio-no-accesible";
  constructor(public readonly estadoHttp: number, mensaje: string = "No se pudo acceder al repositorio.") {
    super(mensaje);
    this.name = "RepositorioNoAccesible";
  }
}

export class RamaNoEncontrada extends Error {
  readonly codigo = "rama-no-encontrada";
  constructor(mensaje: string = "La rama especificada no fue encontrada.") {
    super(mensaje);
    this.name = "RamaNoEncontrada";
  }
}

export class RepositorioSinDockerfile extends Error {
  readonly codigo = "sin-dockerfile";
  constructor(public readonly rama: string, mensaje: string = "No se encontró un Dockerfile en la raíz.") {
    super(mensaje);
    this.name = "RepositorioSinDockerfile";
  }
}

export class FuenteNoDisponible extends Error {
  readonly codigo = "fuente-no-disponible";
  constructor(mensaje: string = "La fuente remota no está disponible temporalmente.") {
    super(mensaje);
    this.name = "FuenteNoDisponible";
  }
}

export class SubdominioEnUso extends Error {
  readonly codigo = "subdominio-en-uso";
  constructor(mensaje: string = "El subdominio ya se encuentra en uso.") {
    super(mensaje);
    this.name = "SubdominioEnUso";
  }
}

export class LimiteProyectosAlcanzado extends Error {
  readonly codigo = "limite-proyectos";
  constructor(mensaje: string = "Se ha alcanzado el límite máximo de proyectos permitidos.") {
    super(mensaje);
    this.name = "LimiteProyectosAlcanzado";
  }
}