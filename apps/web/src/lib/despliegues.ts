/**
 * Lógica pura de la vista de despliegue (12, 12b, 12c). Sin DOM ni red, para `node --test`.
 */

export interface LineaBitacora {
  n: number;
  marca: string;
  etapa?: string;
  texto: string;
  nivel?: "info" | "aviso" | "error";
}

export interface RespuestaBitacora {
  lineas: LineaBitacora[];
  siguiente: number;
  terminado: boolean;
}

export interface PasoBitacora {
  lineas: LineaBitacora[];
  desde: number;
  terminado: boolean;
}

const MARCA_VISIBLE = /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
const ANCHO_MS = 3;
const SEGUNDOS_POR_MINUTO = 60;
const MS_POR_SEGUNDO = 1000;

export const INTERVALO_RELOJ_MS = MS_POR_SEGUNDO;

const NOMBRES_ETAPA = ["Recepción", "Construcción", "Ejecución", "Enrutamiento", "Operación"] as const;

const ETAPA_VISIBLE: Record<string, string> = {
  recepcion: "recepción",
  construccion: "construcción",
  ejecucion: "ejecución",
  enrutamiento: "enrutamiento",
  operacion: "operación",
};

/** La API manda la etapa en minúsculas; la bitácora la muestra como en la ficha. */
export function etapaVisible(etapa: string | undefined): string | undefined {
  if (!etapa) return etapa;
  return ETAPA_VISIBLE[etapa] ?? etapa;
}

/** Acumula líneas por `n` sin reescribir las ya pintadas y sin desordenar. */
export function fusionarLineas(previas: LineaBitacora[], nuevas: LineaBitacora[]): LineaBitacora[] {
  const mapa = new Map(previas.map((linea) => [linea.n, linea]));
  for (const linea of nuevas) if (!mapa.has(linea.n)) mapa.set(linea.n, linea);
  return [...mapa.values()].sort((a, b) => a.n - b.n);
}

/** Última línea con nivel error; si no hay, la última de la etapa que falló. */
export function lineaDeError(lineas: LineaBitacora[], etapaFallida?: string): LineaBitacora | undefined {
  const porNivel = [...lineas].reverse().find((linea) => linea.nivel === "error");
  if (porNivel) return porNivel;
  if (!etapaFallida) return undefined;
  return [...lineas].reverse().find((linea) => linea.etapa === etapaFallida);
}

/** Texto del portapapeles: número, hora y mensaje de cada línea. */
export function textoParaCopiar(lineas: LineaBitacora[]): string {
  return lineas.map((linea) => `${linea.n} ${linea.marca} ${linea.texto}`).join("\n");
}

/** ISO 8601 con milisegundos → `HH:mm:ss.SSS` en UTC (estable en las pruebas). */
export function marcaVisible(marca: string): string {
  if (MARCA_VISIBLE.test(marca)) return marca;
  const fecha = new Date(marca);
  if (Number.isNaN(fecha.getTime())) return marca;
  const parte = (valor: number, ancho = 2) => String(valor).padStart(ancho, "0");
  return `${parte(fecha.getUTCHours())}:${parte(fecha.getUTCMinutes())}:${parte(fecha.getUTCSeconds())}.${parte(fecha.getUTCMilliseconds(), ANCHO_MS)}`;
}

/** «01:41» entre el alta del despliegue y `ahora`. */
export function tiempoTranscurrido(desde: string, ahora: string): string {
  const ms = Math.max(0, new Date(ahora).getTime() - new Date(desde).getTime());
  const total = Math.floor(ms / MS_POR_SEGUNDO);
  const minutos = Math.floor(total / SEGUNDOS_POR_MINUTO);
  const segundos = total % SEGUNDOS_POR_MINUTO;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

/** La versión anterior sigue en línea mientras esta no la reemplaza (12c). */
export function avisoVersionAnterior(numeroAnterior: number | null): string | null {
  if (numeroAnterior === null || numeroAnterior < 1) return null;
  return `Tu versión #${numeroAnterior} sigue sirviendo tráfico.`;
}

export function numeroAnterior(numero: number): number | null {
  return numero > 1 ? numero - 1 : null;
}

/** Aplica un bloque de la API y decide si el cursor avanza. */
export function aplicarBloque(previas: LineaBitacora[], desde: number, respuesta: RespuestaBitacora): PasoBitacora {
  const lineas = fusionarLineas(previas, respuesta.lineas.map((linea) => ({ ...linea, marca: marcaVisible(linea.marca) })));
  if (respuesta.terminado) return { lineas, desde, terminado: true };
  return { lineas, desde: respuesta.siguiente, terminado: false };
}

/** Pide bloques hasta `terminado = true`. El doble de pruebas cuenta las llamadas. */
export async function sondearBitacora(pedir: (desde: number) => Promise<RespuestaBitacora>): Promise<LineaBitacora[]> {
  let desde = 0;
  let lineas: LineaBitacora[] = [];
  for (;;) {
    const paso = aplicarBloque(lineas, desde, await pedir(desde));
    lineas = paso.lineas;
    if (paso.terminado) return lineas;
    desde = paso.desde;
  }
}

export function rutaDespliegue(proyectoId: string, numero: number): string {
  return `/projects/${proyectoId}/despliegues/${numero}`;
}

/** «02 · Construcción» de la etapa en curso o fallida. */
export function etiquetaEtapaActual(etapas: readonly { estado: string }[]): string | null {
  const indice = etapas.findIndex((etapa) => etapa.estado === "en-curso" || etapa.estado === "fallida");
  if (indice < 0) return null;
  const nombre = NOMBRES_ETAPA[indice];
  return nombre ? `${String(indice + 1).padStart(2, "0")} · ${nombre}` : null;
}
