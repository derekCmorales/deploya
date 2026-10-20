import { spawn } from "node:child_process";
import { muestraDesdeStats } from "../../modules/orquestacion/metricas/dominio/muestra-desde-stats";
import { MuestraIlegible } from "../../modules/orquestacion/metricas/dominio/errores";
import {
  MetricasContenedorPuerto,
  type MuestraContenedor,
} from "../../modules/orquestacion/puertos/metricas-contenedor.puerto";

const TIEMPO_MAXIMO_STATS_MS = 10_000;
const TOPE_SALIDA = 8_192;
const TOPE_ERROR = 500;
const ARGS_STATS = ["stats", "--no-stream", "--format", "json"] as const;
const ID_CONTENEDOR = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;

/**
 * Adapter: `docker stats --no-stream --format json`. Sin shell; el id va como argumento.
 * El ejecutable se inyecta para probar sin el daemon.
 */
export class MetricasDockerStats extends MetricasContenedorPuerto {
  constructor(private readonly ejecutable: string = "docker") {
    super();
  }

  async muestra(contenedorId: string): Promise<MuestraContenedor> {
    if (!ID_CONTENEDOR.test(contenedorId)) throw new MuestraIlegible("id de contenedor inválido");
    return muestraDesdeStats(await salidaDe(this.ejecutable, contenedorId));
  }
}

function salidaDe(ejecutable: string, contenedorId: string): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const hijo = spawn(ejecutable, [...ARGS_STATS, contenedorId], { stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => hijo.kill(), TIEMPO_MAXIMO_STATS_MS);
    const buffers = { salida: "", error: "" };
    hijo.stdout.on("data", (dato: Buffer) => acumular(buffers, "salida", dato));
    hijo.stderr.on("data", (dato: Buffer) => acumular(buffers, "error", dato));
    hijo.on("error", (error) => terminar(timer, () => rechazar(error)));
    hijo.on("close", (codigo) => terminar(timer, () => resolverORechazar({ codigo, buffers, resolver, rechazar })));
  });
}

interface CierreStats {
  codigo: number | null;
  buffers: { salida: string; error: string };
  resolver: (salida: string) => void;
  rechazar: (error: Error) => void;
}

function acumular(buffers: { salida: string; error: string }, campo: "salida" | "error", dato: Buffer): void {
  const tope = campo === "salida" ? TOPE_SALIDA : TOPE_ERROR;
  if (buffers[campo].length < tope) buffers[campo] += dato.toString();
}

function terminar(timer: NodeJS.Timeout, accion: () => void): void {
  clearTimeout(timer);
  accion();
}

function resolverORechazar(cierre: CierreStats): void {
  if (cierre.codigo === 0) cierre.resolver(cierre.buffers.salida);
  else cierre.rechazar(new MuestraIlegible(cierre.buffers.error.trim() || `docker stats terminó con ${cierre.codigo}`));
}
