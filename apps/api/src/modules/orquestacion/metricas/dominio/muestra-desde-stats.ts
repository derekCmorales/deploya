import { PORCENTAJE_A_VCPU } from "../metricas.constantes";
import type { MuestraContenedor } from "../../puertos/metricas-contenedor.puerto";
import { redondearCpu } from "./cpu";
import { MuestraIlegible } from "./errores";

const PORCENTAJE = /^([\d.]+)\s*%$/;
const MEMORIA = /^([\d.]+)\s*([a-zA-Z]+)/;
const MIB_POR_UNIDAD: Readonly<Record<string, number>> = {
  b: 1 / (1024 * 1024),
  kib: 1 / 1024,
  kb: 1 / 1024,
  mib: 1,
  mb: 1,
  gib: 1024,
  gb: 1024,
};

/** Traduce una línea de `docker stats --format json` al contrato `{ cpu, memoriaMb }`. */
export function muestraDesdeStats(salida: string): MuestraContenedor {
  const stats = leerStats(primeraLineaJson(salida));
  return { cpu: cpuDesde(stats.CPUPerc), memoriaMb: memoriaDesde(stats.MemUsage) };
}

function primeraLineaJson(salida: string): string {
  const linea = salida.split("\n").map((trozo) => trozo.trim()).find((trozo) => trozo.startsWith("{"));
  if (!linea) throw new MuestraIlegible("docker stats no devolvió json");
  return linea;
}

function leerStats(linea: string): { CPUPerc: string; MemUsage: string } {
  let valor: unknown;
  try {
    valor = JSON.parse(linea);
  } catch {
    throw new MuestraIlegible("docker stats no devolvió json");
  }
  if (!esStats(valor)) throw new MuestraIlegible("docker stats no trajo CPUPerc y MemUsage");
  return valor;
}

function esStats(valor: unknown): valor is { CPUPerc: string; MemUsage: string } {
  if (!valor || typeof valor !== "object") return false;
  const stats = valor as { CPUPerc?: unknown; MemUsage?: unknown };
  return typeof stats.CPUPerc === "string" && typeof stats.MemUsage === "string";
}

function cpuDesde(texto: string): number {
  const coincidencia = texto.match(PORCENTAJE);
  if (!coincidencia) throw new MuestraIlegible("CPUPerc ilegible");
  return redondearCpu(Number(coincidencia[1]) / PORCENTAJE_A_VCPU);
}

function memoriaDesde(texto: string): number {
  const coincidencia = texto.match(MEMORIA);
  const factor = coincidencia ? MIB_POR_UNIDAD[coincidencia[2].toLowerCase()] : undefined;
  if (!coincidencia || factor === undefined) throw new MuestraIlegible("MemUsage ilegible");
  return Math.round(Number(coincidencia[1]) * factor);
}
