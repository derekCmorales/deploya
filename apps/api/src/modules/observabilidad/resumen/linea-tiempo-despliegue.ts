import type { Artefacto, Despliegue } from "../../construccion/dominio/despliegue";
import type { Etapa, RecetaConstruccion } from "../../construccion/dominio/estados";

const BYTES_POR_MB = 1024 * 1024;
const LARGO_SHA_CORTO = 7;

/** Un hito de la línea de tiempo de la pantalla 13. */
export interface HitoLineaTiempo {
  etapa: Etapa;
  titulo: string;
  detalle: string;
  marca: string;
}

export interface ContextoLineaTiempo {
  artefacto: Artefacto | null;
  /** El despliegue que atendía el tráfico antes de este, si lo hubo. */
  anterior: number | null;
}

const NOMBRE_RECETA: Readonly<Record<Exclude<RecetaConstruccion, "dockerfile">, string>> = {
  node: "Node.js",
  python: "Python",
  go: "Go",
  estatica: "sitio estático",
};

/**
 * Los cuatro hitos de la ficha 13, con textos fijos y datos del despliegue; nunca texto libre de
 * Docker. Un hito aparece solo cuando su etapa terminó, así que en un despliegue en curso la
 * línea crece. (Builder puro: se prueba con un despliegue literal.)
 */
export function lineaTiempoDe(despliegue: Despliegue, { artefacto, anterior }: ContextoLineaTiempo): HitoLineaTiempo[] {
  const etapa = (nombre: Etapa) => despliegue.etapas.find((e) => e.etapa === nombre);
  const hitos: (HitoLineaTiempo | null)[] = [
    hito(etapa("recepcion"), "iniciada", despliegue.commit && {
      etapa: "recepcion",
      titulo: "Commit recibido",
      detalle: `${despliegue.commit.sha.slice(0, LARGO_SHA_CORTO)} · ${despliegue.commit.mensaje}`,
    }),
    hito(etapa("construccion"), "terminada", artefacto && {
      etapa: "construccion",
      titulo: "Imagen construida",
      detalle: `${origenDeImagen(artefacto.receta)} · ${Math.round(artefacto.tamanoBytes / BYTES_POR_MB)} MB`,
    }),
    hito(etapa("ejecucion"), "iniciada", despliegue.cpus !== null && despliegue.memoriaMb !== null ? {
      etapa: "ejecucion",
      titulo: "Contenedor iniciado",
      detalle: `${despliegue.cpus} vCPU · ${despliegue.memoriaMb} MB`,
    } : null),
    hito(etapa("enrutamiento"), "terminada", {
      etapa: "enrutamiento",
      titulo: "Tráfico redirigido",
      detalle: anterior === null ? `#${despliegue.numero} en línea` : `#${anterior} detenido · #${despliegue.numero} en línea`,
    }),
  ];
  return hitos.filter((h): h is HitoLineaTiempo => h !== null);
}

export const LineaTiempoDespliegue = { de: lineaTiempoDe } as const;

function origenDeImagen(receta: RecetaConstruccion): string {
  return receta === "dockerfile" ? "desde tu Dockerfile" : `desde la receta ${NOMBRE_RECETA[receta]}`;
}

function hito(
  registro: Despliegue["etapas"][number] | undefined,
  marca: "iniciada" | "terminada",
  contenido: Omit<HitoLineaTiempo, "marca"> | null | undefined,
): HitoLineaTiempo | null {
  const momento = registro?.estado === "completada" ? registro[marca] : null;
  if (!contenido || !momento) return null;
  return { ...contenido, marca: momento.toISOString() };
}
