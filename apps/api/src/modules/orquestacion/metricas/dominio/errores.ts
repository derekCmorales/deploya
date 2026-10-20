/** `docker stats` no devolvió una muestra legible. No sale por HTTP: el muestreo sigue con el resto. */
export class MuestraIlegible extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = "MuestraIlegible";
  }
}
