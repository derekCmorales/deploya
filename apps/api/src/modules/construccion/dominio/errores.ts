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
