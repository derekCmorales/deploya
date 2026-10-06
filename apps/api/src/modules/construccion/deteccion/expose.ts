const PUERTO_MAXIMO = 65535;
const INSTRUCCION_EXPOSE = /^EXPOSE\s+(.+)$/i;

/** El primer puerto de la primera instrucción `EXPOSE` del Dockerfile, o `null`. */
export function primerExpose(dockerfile: string): number | null {
  for (const linea of dockerfile.split(/\r?\n/)) {
    const coincidencia = linea.trim().match(INSTRUCCION_EXPOSE);
    if (!coincidencia) continue;
    const puerto = coincidencia[1].trim().split(/\s+/).map((token) => Number(token.split("/")[0])).find(esPuerto);
    if (puerto) return puerto;
  }
  return null;
}

function esPuerto(valor: number): boolean {
  return Number.isInteger(valor) && valor > 0 && valor <= PUERTO_MAXIMO;
}
