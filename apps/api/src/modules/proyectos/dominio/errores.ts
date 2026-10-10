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

export class ClaveInvalida extends ErrorProyectos {
  readonly codigo = "clave-invalida";

  constructor(mensaje = "La clave usa MAYÚSCULAS y guiones bajos, hasta 128 caracteres.") {
    super(mensaje);
  }
}

export class ClaveReservada extends ErrorProyectos {
  readonly codigo = "clave-reservada";

  constructor() {
    super("PORT es reservada: la tomamos del puerto del proyecto.");
  }
}

export class ValorDemasiadoLargo extends ErrorProyectos {
  readonly codigo = "valor-demasiado-largo";

  constructor() {
    super("El valor supera los 4 KiB.");
  }
}

export class DemasiadasVariables extends ErrorProyectos {
  readonly codigo = "demasiadas-variables";

  constructor(maximo: number) {
    super(`Un proyecto admite hasta ${maximo} variables.`);
  }
}

export class VariableIlegible extends ErrorProyectos {
  readonly codigo = "variable-ilegible";

  constructor() {
    super("No se pudo descifrar una variable. El despliegue no arranca.");
  }
}

export class ConfirmacionNoCoincide extends ErrorProyectos {
  readonly codigo = "confirmacion-no-coincide";

  constructor() {
    super("Escribe el nombre exacto del proyecto para eliminarlo.");
  }
}
