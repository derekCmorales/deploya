export class SuscripcionNoEncontrada extends Error {
  constructor(readonly usuarioId: string) {
    super(`La cuenta ${usuarioId} no tiene suscripción`);
    this.name = "SuscripcionNoEncontrada";
  }
}

export class PlanNoEncontrado extends Error {
  constructor(readonly codigo: string) {
    super(`No existe el plan ${codigo}; corre el seed`);
    this.name = "PlanNoEncontrado";
  }
}
