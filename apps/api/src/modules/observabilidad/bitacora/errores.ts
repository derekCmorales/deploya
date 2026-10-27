/** `?desde=` que no es una fecha ISO 8601. */
export class DesdeBitacoraInvalido extends Error {
  constructor(readonly valor: string) {
    super(`«${valor}» no es una fecha válida`);
    this.name = "DesdeBitacoraInvalido";
  }
}

/** El trabajador no respondió a tiempo: la web sigue consultando cada 3 s. */
export class BitacoraNoDisponible extends Error {
  constructor(motivo: string) {
    super(`No se pudo leer la bitácora del contenedor: ${motivo}`);
    this.name = "BitacoraNoDisponible";
  }
}
