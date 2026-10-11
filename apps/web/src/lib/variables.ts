/**
 * Lógica pura de 11c y 17. La API es la que cifra; aquí solo se valida y se arma el cuerpo.
 */

export const MAXIMO_LARGO_CLAVE = 128;
export const CLAVE_RESERVADA = "PORT";
const CLAVE_VALIDA = /^[A-Z_][A-Z0-9_]*$/;

export interface FilaAlta {
  clave: string;
  valor: string;
}

export interface FilaVariable {
  clave: string;
  valor?: string;
  editada: boolean;
  nueva: boolean;
  /** El valor ya está en el borrador, pero la celda vuelve a los puntos. */
  oculta?: boolean;
}

export interface VariableGuardada {
  clave: string;
  actualizado: string;
}

/** Mensaje de la ficha, o `null` si la clave puede guardarse. Una fila vacía no es error. */
export function errorClave(clave: string): string | null {
  const texto = clave.trim();
  if (!texto) return null;
  if (texto === CLAVE_RESERVADA) return "PORT es reservada: la tomamos del puerto del paso anterior.";
  if (texto.length > MAXIMO_LARGO_CLAVE || !CLAVE_VALIDA.test(texto)) {
    return "Usa MAYÚSCULAS y guiones bajos, hasta 128 caracteres.";
  }
  return null;
}

export function variablesDeAlta(filas: readonly FilaAlta[]): { clave: string; valor: string }[] {
  return filas.filter((fila) => fila.clave.trim() !== "").map((fila) => ({ clave: fila.clave.trim(), valor: fila.valor }));
}

/** Claves borradas, nuevas o con valor editado. Mostrar un valor no cuenta. */
export function contarCambios(guardadas: readonly string[], filas: readonly FilaVariable[]): number {
  const originales = new Set(guardadas);
  const presentes = filas.filter((fila) => fila.clave.trim() !== "");
  const actuales = new Set(presentes.map((fila) => fila.clave));
  const borradas = [...originales].filter((clave) => !actuales.has(clave)).length;
  const tocadas = presentes.filter((fila) => fila.nueva || fila.editada || !originales.has(fila.clave)).length;
  return borradas + tocadas;
}

/** Sin `valor` la API conserva el cifrado. Ocultar no borra un valor ya editado. */
export function cuerpoVariables(filas: readonly FilaVariable[]): { clave: string; valor?: string }[] {
  return filas.filter((fila) => fila.clave.trim() !== "").map((fila) => {
    if (!fila.nueva && !fila.editada) return { clave: fila.clave };
    return { clave: fila.clave, valor: fila.valor ?? "" };
  });
}

export function valorVisible(fila: FilaVariable): boolean {
  return fila.nueva || (fila.valor !== undefined && !fila.oculta);
}

export function filasDesdeGuardadas(guardadas: readonly VariableGuardada[]): FilaVariable[] {
  return guardadas.map((variable) => ({ clave: variable.clave, editada: false, nueva: false }));
}

export function textoCambios(cantidad: number): string {
  if (cantidad === 1) return "1 cambio sin aplicar";
  return `${cantidad} cambios sin aplicar`;
}
