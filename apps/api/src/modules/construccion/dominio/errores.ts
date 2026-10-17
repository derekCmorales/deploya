import type { EstadoDespliegue, Etapa } from "./estados";

/** Errores de dominio del motor. El controlador traduce los de consulta a HTTP. */
export class DespliegueNoEncontrado extends Error {
  constructor(readonly despliegueId: string) {
    super(`No existe el despliegue ${despliegueId}`);
    this.name = "DespliegueNoEncontrado";
  }
}

export class ProyectoNoEncontrado extends Error {
  constructor(readonly proyectoId: string) {
    super(`No existe el proyecto ${proyectoId}`);
    this.name = "ProyectoNoEncontrado";
  }
}

export class TransicionInvalida extends Error {
  constructor(
    readonly de: EstadoDespliegue,
    readonly a: EstadoDespliegue,
  ) {
    super(`Transición inválida: ${de} → ${a}`);
    this.name = "TransicionInvalida";
  }
}

/**
 * Un fallo esperado en una etapa: no sale por HTTP, deja el despliegue Fallido
 * con su motivo y, si lo hay, el código de salida.
 */
export class FalloDespliegue extends Error {
  constructor(
    readonly etapa: Etapa,
    readonly motivo: string,
    readonly codigoSalida: number | null = null,
  ) {
    super(motivo);
    this.name = "FalloDespliegue";
  }
}

export class ClonFallido extends FalloDespliegue {
  constructor(detalle: string) {
    super("recepcion", `No se pudo clonar el repositorio: ${detalle}`);
    this.name = "ClonFallido";
  }
}

export class ConstruccionFallida extends FalloDespliegue {
  constructor(codigoSalida: number, detalle: string) {
    super("construccion", `La construcción terminó con código ${codigoSalida}: ${detalle}`, codigoSalida);
    this.name = "ConstruccionFallida";
  }
}

export class TiempoConstruccionAgotado extends FalloDespliegue {
  constructor() {
    super("construccion", "Tiempo de construcción agotado");
    this.name = "TiempoConstruccionAgotado";
  }
}

export class SaludNoAlcanzada extends FalloDespliegue {
  constructor(segundos: number, detalle: string) {
    super("ejecucion", `No respondió en ${segundos} s: ${detalle}`);
    this.name = "SaludNoAlcanzada";
  }
}

/** Un valor cifrado de M3 fue alterado: el contenedor no se crea y la versión activa no cambia. */
export class VariablesIlegibles extends FalloDespliegue {
  constructor() {
    super("ejecucion", "Variable ilegible");
    this.name = "VariablesIlegibles";
  }
}

export class EnrutamientoFallido extends FalloDespliegue {
  constructor(detalle: string) {
    super("enrutamiento", `No se pudo publicar la ruta: ${detalle}`);
    this.name = "EnrutamientoFallido";
  }
}

/**
 * Sin `Dockerfile` y sin receta que reconozca el stack (M4-03). No es un fallo de etapa:
 * M3 lo muestra en 11e y el trabajador lo convierte en `DeteccionFallida`.
 */
export class StackNoReconocido extends Error {
  static readonly MOTIVO = "falta Dockerfile y no se reconoce el stack";

  constructor(readonly pista: string) {
    super(StackNoReconocido.MOTIVO);
    this.name = "StackNoReconocido";
  }
}

export class DeteccionFallida extends FalloDespliegue {
  constructor(error: StackNoReconocido) {
    super("recepcion", `${capitalizar(error.message)}: ${error.pista}`);
    this.name = "DeteccionFallida";
  }
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** M4-02: un rechazo de una acción sobre un despliegue; sale como 409 `{ codigo, mensaje }`. */
export abstract class RechazoAccionDespliegue extends Error {
  abstract readonly codigo: string;
}

export class YaNoSePuedeCancelar extends RechazoAccionDespliegue {
  readonly codigo = "ya-no-se-puede-cancelar";

  constructor(readonly estado: EstadoDespliegue) {
    super(`No se puede cancelar un despliegue en estado ${estado}`);
    this.name = "YaNoSePuedeCancelar";
  }
}

export class SoloSeReintentaUnFallido extends RechazoAccionDespliegue {
  readonly codigo = "solo-se-reintenta-un-fallido";

  constructor(readonly estado: EstadoDespliegue) {
    super(`Solo se reintenta un despliegue Fallido; este está ${estado}`);
    this.name = "SoloSeReintentaUnFallido";
  }
}

export class CommitDesconocido extends RechazoAccionDespliegue {
  readonly codigo = "commit-desconocido";

  constructor(readonly commitSha: string) {
    super("Ese commit nunca se desplegó en este proyecto");
    this.name = "CommitDesconocido";
  }
}

/**
 * Lo lanzan los pasos cuando la señal de cancelación aborta su trabajo. No es un fallo de
 * etapa: el pipeline deja el despliegue Cancelado (no Fallido).
 */
export class DespliegueCancelado extends Error {
  constructor() {
    super("Cancelado por el usuario");
    this.name = "DespliegueCancelado";
  }
}
