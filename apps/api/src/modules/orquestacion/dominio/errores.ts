/** Rechazos de M5 antes de crear un despliegue que construye (M5-03). Salen como 409 con `codigo`. */
export abstract class BloqueoDespliegue extends Error {
  abstract readonly codigo: string;
}

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
