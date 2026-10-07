/** Rechazos de M5 que salen como 409 `{ codigo, mensaje }` (contrato de despliegues v2.1). */
export abstract class RechazoOrquestacion extends Error {
  abstract readonly codigo: string;
}

/** M5-03: se rechaza antes de crear un despliegue que construye. */
export abstract class BloqueoDespliegue extends RechazoOrquestacion {}

export class SuscripcionNoPermite extends BloqueoDespliegue {
  readonly codigo = "suscripcion-no-permite";

  constructor(readonly estado: string) {
    super(`Tu suscripción está ${estado}: renuévala para volver a desplegar`);
    this.name = "SuscripcionNoPermite";
  }
}

export class CuotaConstruccionesAgotada extends BloqueoDespliegue {
  readonly codigo = "cuota-construcciones-agotada";

  constructor(readonly construccionesMes: number) {
    super(`Usaste las ${construccionesMes} construcciones de tu plan este mes`);
    this.name = "CuotaConstruccionesAgotada";
  }
}

/** M5-02: reiniciar o detener un proyecto que nunca quedó Saludable. */
export class SinDespliegueActivo extends RechazoOrquestacion {
  readonly codigo = "sin-despliegue-activo";

  constructor(readonly proyectoId: string) {
    super("El proyecto no tiene una versión activa");
    this.name = "SinDespliegueActivo";
  }
}

/** M5-02: la acción no aplica al estado del despliegue activo (p. ej. detener uno que se está reiniciando). */
export class AccionNoPermitida extends RechazoOrquestacion {
  readonly codigo = "accion-no-permitida";

  constructor(
    readonly accion: string,
    readonly estado: string,
  ) {
    super(`No se puede ${accion} un despliegue en estado ${estado}`);
    this.name = "AccionNoPermitida";
  }
}
