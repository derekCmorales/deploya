<<<<<<< HEAD
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
=======
/**
 * Errores de dominio de M3. Cada uno lleva el `codigo` que la web usa para elegir
 * el mensaje de 11a/11e; el filtro del controlador los traduce a HTTP.
 */
export abstract class ErrorProyectos extends Error {
  abstract readonly codigo: string;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }

  /** Datos que la web necesita además del mensaje. */
  detalle(): Record<string, unknown> {
    return {};
  }
}

export class UrlRepositorioInvalida extends ErrorProyectos {
  readonly codigo = "url-invalida";

  constructor() {
    super("La URL debe ser https://github.com/<dueño>/<repositorio>.");
  }
}

export class DatosAltaInvalidos extends ErrorProyectos {
  readonly codigo = "datos-invalidos";
}

export class RepositorioNoAccesible extends ErrorProyectos {
  readonly codigo = "repositorio-no-accesible";

  constructor(readonly estadoHttp: number) {
    super(`No pudimos acceder al repositorio (HTTP ${estadoHttp}).`);
  }

  detalle(): Record<string, unknown> {
    return { estadoHttp: this.estadoHttp };
  }
}

export class RamaNoEncontrada extends ErrorProyectos {
  readonly codigo = "rama-no-encontrada";

  constructor(readonly rama: string) {
    super(`La rama ${rama} no existe en el repositorio.`);
  }

  detalle(): Record<string, unknown> {
    return { rama: this.rama };
  }
}

export class RepositorioSinDockerfile extends ErrorProyectos {
  readonly codigo = "sin-dockerfile";

  constructor(readonly rama: string) {
    super(`No encontramos un Dockerfile en la raíz de ${rama}.`);
  }

  detalle(): Record<string, unknown> {
    return { rama: this.rama };
  }
}

export class FuenteNoDisponible extends ErrorProyectos {
  readonly codigo = "fuente-no-disponible";

  constructor() {
    super("GitHub no respondió. Intenta de nuevo en unos minutos.");
  }
}

export class SubdominioEnUso extends ErrorProyectos {
  readonly codigo = "subdominio-en-uso";

  constructor(readonly subdominio: string) {
    super(`Ya existe un proyecto con la URL ${subdominio}. Elige otro nombre.`);
  }

  detalle(): Record<string, unknown> {
    return { subdominio: this.subdominio };
  }
}

export class LimiteProyectosAlcanzado extends ErrorProyectos {
  readonly codigo = "limite-proyectos";

  constructor(readonly maximo: number) {
    super(`Tu plan permite ${maximo} ${maximo === 1 ? "proyecto" : "proyectos"}.`);
  }

  detalle(): Record<string, unknown> {
    return { maximo: this.maximo };
  }
}

export class ProyectoNoEncontrado extends ErrorProyectos {
  readonly codigo = "proyecto-no-encontrado";

  constructor(readonly proyectoId: string) {
    super(`No encontramos el proyecto ${proyectoId}.`);
  }
}

export class ConfirmacionNoCoincide extends ErrorProyectos {
  readonly codigo = "confirmacion-no-coincide";

  constructor() {
    super("Escribe el nombre exacto del proyecto para eliminarlo.");
  }
}
>>>>>>> origin/main
