/**
 * Lógica pura de las pantallas 16 (Métricas del proyecto) y 13c (Últimas 24 h).
 * Sin React, DOM ni red para poder probarla con `node --test`.
 */

export const UMBRAL_AVISO = 0.8;
export const PORCENTAJE = 100;

const MS_POR_MINUTO = 60_000;
const MS_POR_HORA = 60 * MS_POR_MINUTO;
const MS_POR_MEDIA_HORA = 30 * MS_POR_MINUTO;
const MS_POR_CUARTO_DE_HORA = 15 * MS_POR_MINUTO;
const MS_POR_SEIS_HORAS = 6 * MS_POR_HORA;
const CUBOS_24H = 48;
const DIA_MS = 24 * MS_POR_HORA;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] as const;

export type RangoMetricas = "1h" | "24h";
export type RecursoMetrica = "cpu" | "memoria";
export type EstadoUso = "Holgada" | "Cerca del límite" | "Al límite";

/** `GET /proyectos/:id/metricas?rango=1h|24h` (contrato `docs/contratos/metricas.md`). */
export interface PuntoSerie {
  en: string;
  cpu: number;
  memoriaMb: number;
}

export interface ChipDespliegue {
  en: string;
  version: number;
}

export interface PromedioVersion {
  version: number;
  memoriaMb: number;
  cpu: number;
}

export interface ValorPico {
  valor: number;
  en: string;
}

export interface PicoMetricas {
  cpu: ValorPico | null;
  memoriaMb: ValorPico | null;
}

export interface RespuestaMetricas {
  limite: { cpu: number; memoriaMb: number };
  serie: PuntoSerie[];
  pico: PicoMetricas;
  aviso: string | null;
  despliegues: ChipDespliegue[];
  promedioPorVersion: PromedioVersion[];
}

/** Punto que consume `GraficaUso`, independiente del recurso. */
export interface PuntoGrafica {
  tiempo: string;
  valor: number;
}

export interface DeltaMemoria {
  /** Texto corto bajo el valor: «▲ 90 MB desde #13». */
  texto: string;
  /** Frase del banner: «Subió unos 90 MB desde la versión #13». */
  frase: string;
}

export interface UsoRecurso {
  recurso: RecursoMetrica;
  titulo: "Memoria" | "CPU";
  cifra: string;
  unidad: string;
  limite: string;
  porcentaje: number;
  estado: EstadoUso;
  delta: DeltaMemoria | null;
}

export interface AvisoMemoria {
  titulo: string;
  cuerpo: string;
}

export interface ComparacionVersiones {
  anterior: number;
  actual: number;
  etiqueta: string;
}

export interface VistaMetricas {
  memoria: UsoRecurso | null;
  cpu: UsoRecurso | null;
  banner: AvisoMemoria | null;
  /** «Promedio con #13: 328 MB · con #14: 417 MB. Pico: 452 MB, hoy 14:00.» */
  promedios: string | null;
  /** «pico 0.27 · hoy 03:30». */
  picoCpu: string | null;
  /** «Holgada: nunca pasó del 54 % del límite en 24 h.» */
  fraseCpu: string | null;
  comparacion: ComparacionVersiones | null;
  eventos: ChipDespliegue[];
  series: { memoria: PuntoGrafica[]; cpu: PuntoGrafica[] };
  ventana: { inicio: string; fin: string };
  limiteMemoria: number;
  limiteCpu: number;
}

export interface VistaResumen {
  memoria: UsoRecurso;
  cpu: UsoRecurso;
  series: { memoria: PuntoGrafica[]; cpu: PuntoGrafica[] };
  ventana: { inicio: string; fin: string };
  limiteMemoria: number;
  limiteCpu: number;
}

/** Holgada por debajo del 80 %, cerca hasta el 99 % y al límite desde el 100 %. */
export function estadoEnPalabra(pct: number): EstadoUso {
  if (pct >= PORCENTAJE) return "Al límite";
  if (pct >= UMBRAL_AVISO * PORCENTAJE) return "Cerca del límite";
  return "Holgada";
}

/** Titular del banner con el plan que devuelve la API. Sin plan: «del límite del plan». */
export function textoBanner(porcentajeMemoria: number, nombrePlan: string | null): string {
  const destino = nombrePlan ? `de ${nombrePlan}` : "del plan";
  return `La memoria está al ${porcentajeMemoria} % del límite ${destino}`;
}

/** «Subió unos 90 MB desde la versión #13. Si llega a 512 MB, Docker reinicia el contenedor.» */
export function cuerpoBanner(fraseDelta: string | null, limiteMb: number): string {
  const inicio = fraseDelta ? `${fraseDelta}. ` : "";
  return `${inicio}Si llega a ${limiteMb} MB, Docker reinicia el contenedor.`;
}

/** «El contenedor no está corriendo» si la API lo avisa; `null` si corre. */
export function corriendoONo(respuesta: RespuestaMetricas): string | null {
  return respuesta.aviso;
}

/** Ventana exacta de la serie: 1 h hacia atrás, o 48 cubos de 30 min alineados a :00/:30 UTC. */
export function ventanaDe(rango: RangoMetricas, ahora: Date): { inicio: Date; fin: Date } {
  if (rango === "1h") return { inicio: new Date(ahora.getTime() - MS_POR_HORA), fin: ahora };
  const ultimo = Math.floor(ahora.getTime() / MS_POR_MEDIA_HORA) * MS_POR_MEDIA_HORA;
  return { inicio: new Date(ultimo - (CUBOS_24H - 1) * MS_POR_MEDIA_HORA), fin: ahora };
}

/** Punto por minuto (1 h) o promedio de 30 min (24 h) ya serializado por la API. */
export function puntosDe(respuesta: RespuestaMetricas, recurso: RecursoMetrica): PuntoGrafica[] {
  return respuesta.serie.map((punto) => ({
    tiempo: punto.en,
    valor: recurso === "cpu" ? punto.cpu : punto.memoriaMb,
  }));
}

/** Zona de aviso del 80 % del límite (regla 2 de `docs/diseno/README.md § Gráficas`). */
export function tonoDeUso(valor: number, limite: number): "normal" | "aviso" {
  if (!Number.isFinite(valor) || !Number.isFinite(limite) || limite <= 0) return "normal";
  return valor / limite >= UMBRAL_AVISO ? "aviso" : "normal";
}

export function vistaMetricas(
  respuesta: RespuestaMetricas,
  nombrePlan: string | null,
  rango: RangoMetricas,
  ahora: Date,
): VistaMetricas {
  const ventana = isoDe(ventanaDe(rango, ahora));
  const series = { memoria: puntosDe(respuesta, "memoria"), cpu: puntosDe(respuesta, "cpu") };

  if (respuesta.aviso !== null) {
    return {
      memoria: null,
      cpu: null,
      banner: null,
      promedios: null,
      picoCpu: null,
      fraseCpu: null,
      comparacion: null,
      eventos: [],
      series,
      ventana,
      limiteMemoria: respuesta.limite.memoriaMb,
      limiteCpu: respuesta.limite.cpu,
    };
  }

  const ultimo = respuesta.serie[respuesta.serie.length - 1] ?? null;
  const previa = versionAnterior(respuesta.promedioPorVersion);
  const delta = ultimo && previa ? deltaDeMemoria(ultimo.memoriaMb, previa.memoriaMb, previa.version) : null;
  const memoria = ultimo ? usoDe("memoria", ultimo.memoriaMb, respuesta.limite.memoriaMb) : null;
  const cpu = ultimo ? usoDe("cpu", ultimo.cpu, respuesta.limite.cpu) : null;
  const porcentajeMemoria = memoria?.porcentaje ?? 0;
  const enAviso = ultimo ? tonoDeUso(ultimo.memoriaMb, respuesta.limite.memoriaMb) === "aviso" : false;

  return {
    memoria: memoria ? { ...memoria, delta } : null,
    cpu,
    banner:
      memoria && enAviso
        ? { titulo: textoBanner(porcentajeMemoria, nombrePlan), cuerpo: cuerpoBanner(delta?.frase ?? null, respuesta.limite.memoriaMb) }
        : null,
    promedios: lineaDePromedios(respuesta, ahora),
    picoCpu: picoDeCpu(respuesta, ahora),
    fraseCpu: fraseDeCpu(respuesta, rango),
    comparacion: comparacionDe(respuesta.promedioPorVersion),
    eventos: eventosDe(respuesta),
    series,
    ventana,
    limiteMemoria: respuesta.limite.memoriaMb,
    limiteCpu: respuesta.limite.cpu,
  };
}

/** Tarjeta 13c: solo CPU y memoria de la ventana de 24 h. */
export function vistaResumen(respuesta: RespuestaMetricas, ahora: Date): VistaResumen | null {
  if (respuesta.aviso !== null) return null;
  const vista = vistaMetricas(respuesta, null, "24h", ahora);
  if (!vista.memoria || !vista.cpu) return null;
  return {
    memoria: vista.memoria,
    cpu: vista.cpu,
    series: vista.series,
    ventana: vista.ventana,
    limiteMemoria: vista.limiteMemoria,
    limiteCpu: vista.limiteCpu,
  };
}

/** «hoy 14:00» · «ayer 18:00» · «20 oct 14:00», en UTC como el resto de la app. */
export function etiquetaMomento(iso: string, ahora: Date): string {
  const fecha = new Date(iso);
  const hora = horaCorta(iso);
  const dias = diasDesdeEpoca(ahora) - diasDesdeEpoca(fecha);
  if (dias === 0) return `hoy ${hora}`;
  if (dias === 1) return `ayer ${hora}`;
  return `${fecha.getUTCDate()} ${MESES[fecha.getUTCMonth()]} ${hora}`;
}

/** Marcas del eje X en horas redondas (cada 15 min en 1 h, cada 6 h en 24 h). */
export function etiquetasDeTiempo(inicio: string, fin: string, ahora: Date): { fraccion: number; texto: string }[] {
  const tInicio = Date.parse(inicio);
  const tFin = Date.parse(fin);
  if (!Number.isFinite(tInicio) || !Number.isFinite(tFin) || tFin <= tInicio) return [];
  const duracion = tFin - tInicio;
  const paso = duracion <= 2 * MS_POR_HORA ? MS_POR_CUARTO_DE_HORA : MS_POR_SEIS_HORAS;
  const separacion = duracion * 0.12;
  const marcas = [{ fraccion: 0, texto: etiquetaMomento(inicio, ahora) }];
  let primero = Math.ceil((tInicio + 1) / paso) * paso;
  while (primero - tInicio < separacion) primero += paso;
  for (let t = primero; t < tFin - separacion; t += paso) {
    marcas.push({ fraccion: (t - tInicio) / duracion, texto: horaCorta(new Date(t).toISOString()) });
  }
  marcas.push({ fraccion: 1, texto: "ahora" });
  return marcas;
}

function usoDe(recurso: RecursoMetrica, valor: number, limite: number): UsoRecurso | null {
  if (!Number.isFinite(valor) || !Number.isFinite(limite) || limite <= 0) return null;
  const porcentaje = Math.round((valor / limite) * PORCENTAJE);
  if (recurso === "memoria") {
    return {
      recurso,
      titulo: "Memoria",
      cifra: `${Math.round(valor)}`,
      unidad: "MB",
      limite: `${limite} MB`,
      porcentaje,
      estado: estadoEnPalabra(porcentaje),
      delta: null,
    };
  }
  return {
    recurso,
    titulo: "CPU",
    cifra: `${valor}`,
    unidad: "vCPU",
    limite: `${limite} vCPU`,
    porcentaje,
    estado: estadoEnPalabra(porcentaje),
    delta: null,
  };
}

function deltaDeMemoria(valorActual: number, valorAnterior: number, versionAnterior: number): DeltaMemoria {
  const diferencia = Math.round(valorActual - valorAnterior);
  if (diferencia === 0) {
    return { texto: `Sin cambios desde #${versionAnterior}`, frase: `Sin cambios desde la versión #${versionAnterior}` };
  }
  const signo = diferencia > 0 ? "▲" : "▼";
  const verbo = diferencia > 0 ? "Subió" : "Bajó";
  return {
    texto: `${signo} ${Math.abs(diferencia)} MB desde #${versionAnterior}`,
    frase: `${verbo} unos ${Math.abs(diferencia)} MB desde la versión #${versionAnterior}`,
  };
}

function versionAnterior(promedios: PromedioVersion[]): PromedioVersion | null {
  const orden = [...promedios].sort((a, b) => a.version - b.version);
  return orden.length < 2 ? null : orden[orden.length - 2];
}

function comparacionDe(promedios: PromedioVersion[]): ComparacionVersiones | null {
  const orden = [...promedios].sort((a, b) => a.version - b.version);
  if (orden.length < 2) return null;
  const anterior = orden[orden.length - 2];
  const actual = orden[orden.length - 1];
  return { anterior: anterior.version, actual: actual.version, etiqueta: `Comparar #${anterior.version} y #${actual.version}` };
}

function lineaDePromedios(respuesta: RespuestaMetricas, ahora: Date): string | null {
  const promedios = respuesta.promedioPorVersion.length
    ? `Promedio con ${[...respuesta.promedioPorVersion]
        .sort((a, b) => a.version - b.version)
        .map((p) => `#${p.version}: ${p.memoriaMb} MB`)
        .join(" · con ")}.`
    : null;
  const pico = respuesta.pico.memoriaMb ? `Pico: ${respuesta.pico.memoriaMb.valor} MB, ${etiquetaMomento(respuesta.pico.memoriaMb.en, ahora)}.` : null;
  const linea = [promedios, pico].filter((parte): parte is string => parte !== null).join(" ");
  return linea === "" ? null : linea;
}

function picoDeCpu(respuesta: RespuestaMetricas, ahora: Date): string | null {
  return respuesta.pico.cpu ? `pico ${respuesta.pico.cpu.valor} · ${etiquetaMomento(respuesta.pico.cpu.en, ahora)}` : null;
}

function fraseDeCpu(respuesta: RespuestaMetricas, rango: RangoMetricas): string | null {
  const pico = respuesta.pico.cpu;
  if (!pico || respuesta.limite.cpu <= 0) return null;
  const porcentaje = Math.round((pico.valor / respuesta.limite.cpu) * PORCENTAJE);
  const estado = estadoEnPalabra(porcentaje);
  const ventana = rango === "1h" ? "1 h" : "24 h";
  if (estado === "Holgada") return `Holgada: nunca pasó del ${porcentaje} % del límite en ${ventana}.`;
  if (estado === "Cerca del límite") return `Cerca del límite: llegó al ${porcentaje} % del límite en ${ventana}.`;
  return `Al límite: llegó al ${porcentaje} % del límite en ${ventana}.`;
}

function eventosDe(respuesta: RespuestaMetricas): ChipDespliegue[] {
  return [...respuesta.despliegues].sort((a, b) => Date.parse(a.en) - Date.parse(b.en));
}

function isoDe(ventana: { inicio: Date; fin: Date }): { inicio: string; fin: string } {
  return { inicio: ventana.inicio.toISOString(), fin: ventana.fin.toISOString() };
}

function horaCorta(iso: string): string {
  const fecha = new Date(iso);
  return `${dosDigitos(fecha.getUTCHours())}:${dosDigitos(fecha.getUTCMinutes())}`;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

function diasDesdeEpoca(fecha: Date): number {
  return Math.floor(fecha.getTime() / DIA_MS);
}
