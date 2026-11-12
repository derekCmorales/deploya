/** Largo máximo de `Proyecto.comandoInicio` (columna `VarChar(512)`). */
export const LARGO_MAXIMO_COMANDO = 512;

export class ComandoMalFormado extends Error {
  constructor(detalle: string) {
    super(detalle);
    this.name = "ComandoMalFormado";
  }
}

type Comilla = "'" | '"';

interface Lectura {
  argumentos: string[];
  actual: string;
  /** Hay un argumento abierto aunque esté vacío (`""` es un argumento). */
  abierto: boolean;
  comilla: Comilla | null;
}

/**
 * Parte `node dist/worker.js --cola "a b"` en `["node", "dist/worker.js", "--cola", "a b"]`, como
 * lo haría un shell POSIX con comillas simples y dobles, pero sin shell: nada de variables,
 * tuberías ni sustituciones. Dentro de comillas dobles, `\"` y `\\` se escapan; fuera, `\` escapa
 * el carácter siguiente. Lanza `ComandoMalFormado` si una comilla queda abierta.
 */
export function argumentosDeComando(texto: string): string[] {
  const lectura: Lectura = { argumentos: [], actual: "", abierto: false, comilla: null };
  for (let i = 0; i < texto.length; i += 1) i = leer(lectura, texto, i);
  if (lectura.comilla) throw new ComandoMalFormado(`Falta cerrar la comilla ${lectura.comilla}`);
  cerrarArgumento(lectura);
  return lectura.argumentos;
}

/** Procesa el carácter en `i` y devuelve el índice del último que consumió. */
function leer(lectura: Lectura, texto: string, i: number): number {
  const caracter = texto[i];
  if (lectura.comilla === "'") return dentroDeSimples(lectura, caracter, i);
  if (lectura.comilla === '"') return dentroDeDobles(lectura, texto, i);
  return fueraDeComillas(lectura, texto, i);
}

function dentroDeSimples(lectura: Lectura, caracter: string, i: number): number {
  if (caracter === "'") lectura.comilla = null;
  else lectura.actual += caracter;
  return i;
}

function dentroDeDobles(lectura: Lectura, texto: string, i: number): number {
  const caracter = texto[i];
  if (caracter === '"') {
    lectura.comilla = null;
    return i;
  }
  if (caracter === "\\" && (texto[i + 1] === '"' || texto[i + 1] === "\\")) {
    lectura.actual += texto[i + 1];
    return i + 1;
  }
  lectura.actual += caracter;
  return i;
}

function fueraDeComillas(lectura: Lectura, texto: string, i: number): number {
  const caracter = texto[i];
  if (/\s/.test(caracter)) {
    cerrarArgumento(lectura);
    return i;
  }
  lectura.abierto = true;
  if (caracter === "'" || caracter === '"') {
    lectura.comilla = caracter;
    return i;
  }
  if (caracter === "\\" && i + 1 < texto.length) {
    lectura.actual += texto[i + 1];
    return i + 1;
  }
  lectura.actual += caracter;
  return i;
}

function cerrarArgumento(lectura: Lectura): void {
  if (lectura.abierto) lectura.argumentos.push(lectura.actual);
  lectura.actual = "";
  lectura.abierto = false;
}
