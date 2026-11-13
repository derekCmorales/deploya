/**
 * Lógica pura de 11c y 17. La API es la que cifra; aquí solo se valida y se arma el cuerpo.
 */

export const MAXIMO_LARGO_CLAVE = 128;
/** Tope de variables por proyecto (contrato recursos-datos: pasó de 50 a 150). */
export const MAXIMO_VARIABLES = 150;
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

// ── Pegar .env (17) ─────────────────────────────────────────────────────────

export interface LineaRechazada {
  linea: number;
  motivo: string;
}

export interface EnvPegado {
  variables: FilaAlta[];
  rechazadas: LineaRechazada[];
}

const COMILLAS = /^(["'])([\s\S]*)\1$/;
const COMENTARIO_EN_LINEA = /\s+#.*$/;

/** Quita comillas que envuelven el valor; sin comillas, un ` # comentario` al final no es parte del valor. */
function valorDeEnv(crudo: string): string {
  const texto = crudo.trim();
  const entre = COMILLAS.exec(texto);
  if (!entre) return texto.replace(COMENTARIO_EN_LINEA, "");
  return entre[1] === '"' ? entre[2].replace(/\\n/g, "\n") : entre[2];
}

function rechazoDeLinea(linea: string): string | null {
  const igual = linea.indexOf("=");
  if (igual <= 0) return "Falta «CLAVE=valor».";
  const clave = linea.slice(0, igual).trim();
  const motivo = errorClave(clave);
  return motivo ? `${clave}: ${motivo}` : null;
}

/**
 * Lee líneas `CLAVE=valor` (admite `export CLAVE=valor`), ignora vacías y `#`. Si una clave se repite gana la
 * última, como en dotenv. Las claves que la API rechazaría (minúsculas, `PORT`) quedan en `rechazadas`.
 */
export function parsearEnv(texto: string): EnvPegado {
  const porClave = new Map<string, string>();
  const rechazadas: LineaRechazada[] = [];
  const lineas = texto.split(/\r?\n/);
  for (const [indice, original] of lineas.entries()) {
    const linea = original.trim().replace(/^export\s+/, "");
    if (!linea || linea.startsWith("#")) continue;
    const rechazo = rechazoDeLinea(linea);
    if (rechazo) {
      rechazadas.push({ linea: indice + 1, motivo: rechazo });
      continue;
    }
    const igual = linea.indexOf("=");
    const clave = linea.slice(0, igual).trim();
    porClave.delete(clave);
    porClave.set(clave, valorDeEnv(linea.slice(igual + 1)));
  }
  return { variables: [...porClave].map(([clave, valor]) => ({ clave, valor })), rechazadas };
}

/** Lo pegado pisa el valor de una clave existente (queda editada) y agrega las demás como nuevas. */
export function combinarVariables(filas: readonly FilaVariable[], pegadas: readonly FilaAlta[]): FilaVariable[] {
  const valores = new Map(pegadas.map((p) => [p.clave, p.valor]));
  const actualizadas = filas.map((fila) => {
    const valor = valores.get(fila.clave);
    return valor === undefined ? fila : { ...fila, valor, editada: true, oculta: false };
  });
  const existentes = new Set(filas.map((fila) => fila.clave));
  const nuevas = pegadas.filter((p) => !existentes.has(p.clave)).map((p) => ({ clave: p.clave, valor: p.valor, editada: false, nueva: true }));
  return [...actualizadas.filter((fila) => fila.clave.trim() !== "" || !fila.nueva), ...nuevas];
}

/** Cuántas claves con valor tendría el proyecto tras pegar, para avisar antes de pasar el tope. */
export function totalTrasPegar(filas: readonly FilaVariable[], pegadas: readonly FilaAlta[]): number {
  return combinarVariables(filas, pegadas).filter((fila) => fila.clave.trim() !== "").length;
}

/** «Se agregan 3 nuevas y se reemplazan 2». */
export function textoResumenPegado(filas: readonly FilaVariable[], pegadas: readonly FilaAlta[]): string {
  const existentes = new Set(filas.map((fila) => fila.clave));
  const reemplazadas = pegadas.filter((p) => existentes.has(p.clave)).length;
  const nuevas = pegadas.length - reemplazadas;
  const textoNuevas = nuevas === 1 ? "1 nueva" : `${nuevas} nuevas`;
  return reemplazadas === 0 ? `Se agregan ${textoNuevas}` : `Se agregan ${textoNuevas} y se reemplazan ${reemplazadas}`;
}

// ── Alta guiada (feat/m3-alta-guiada): el borrador del alta usa las mismas filas que 17 ─────

export function filaNueva(): FilaVariable {
  return { clave: "", valor: "", editada: false, nueva: true };
}

/** En el alta todo es nuevo: cada clave con su valor, sin filas vacías. */
export function variablesDeBorrador(filas: readonly FilaVariable[]): { clave: string; valor: string }[] {
  return filas.filter((fila) => fila.clave.trim() !== "").map((fila) => ({ clave: fila.clave.trim(), valor: fila.valor ?? "" }));
}

/** Claves propias que coinciden con una que inyecta un recurso: la del usuario gana (recursos-datos.md). */
export function clavesQueGanan(filas: readonly FilaVariable[], inyectadas: readonly string[]): Set<string> {
  const conjunto = new Set(inyectadas);
  return new Set(filas.map((fila) => fila.clave.trim()).filter((clave) => clave !== "" && conjunto.has(clave)));
}

export function contarClaves(filas: readonly FilaVariable[]): number {
  return filas.filter((fila) => fila.clave.trim() !== "").length;
}

/** Quita una fila; si era la última, deja una vacía para seguir escribiendo. */
export function quitarFila(filas: readonly FilaVariable[], indice: number, dejarVacia: boolean): FilaVariable[] {
  const restantes = filas.filter((_, i) => i !== indice);
  return restantes.length === 0 && dejarVacia ? [filaNueva()] : restantes;
}
