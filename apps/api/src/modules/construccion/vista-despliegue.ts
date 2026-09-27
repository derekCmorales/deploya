import type { Despliegue, EtapaRegistrada, LineaBitacora } from "./dominio/despliegue";
import { estaTerminado, type EstadoDespliegue, type EstadoEtapa, type Etapa, type NivelBitacora } from "./dominio/estados";

/** Forma de `GET /despliegues/:id` (docs/contratos/despliegues.md, v1 + campos v2). */
export interface VistaDespliegue {
  id: string;
  numero: number;
  proyectoId: string;
  estado: EstadoDespliegue;
  disparador: string;
  commit: { sha: string; mensaje: string; rama: string; autor: string } | null;
  url: string | null;
  imagen: { numero: number; digest: string; tamanoBytes: number; receta: string } | null;
  recursos: { cpus: number; memoriaMb: number } | null;
  codigoSalida: number | null;
  motivoFallo: string | null;
  creado: string;
  terminado: string | null;
  etapas: { nombre: Etapa; estado: EstadoEtapa; duracionMs: number | null }[];
}

export interface ImagenDeVista {
  numero: number;
  digest: string;
  tamanoBytes: number;
  receta: string;
}

export interface PaginaBitacora {
  lineas: { n: number; marca: string; etapa: Etapa; texto: string; nivel: NivelBitacora }[];
  siguiente: number;
  terminado: boolean;
}

export function vistaDespliegue(despliegue: Despliegue, imagen: ImagenDeVista | null): VistaDespliegue {
  return {
    id: despliegue.id,
    numero: despliegue.numero,
    proyectoId: despliegue.proyectoId,
    estado: despliegue.estado,
    disparador: despliegue.disparador,
    commit: despliegue.commit ? { ...despliegue.commit, rama: despliegue.rama } : null,
    url: despliegue.url,
    imagen,
    recursos: recursosDe(despliegue),
    codigoSalida: despliegue.codigoSalida,
    motivoFallo: despliegue.motivoFallo,
    creado: despliegue.creado.toISOString(),
    terminado: despliegue.terminado?.toISOString() ?? null,
    etapas: despliegue.etapas.map(vistaEtapa),
  };
}

export function paginaBitacora(lineas: LineaBitacora[], desde: number, estado: EstadoDespliegue): PaginaBitacora {
  const ultima = lineas.at(-1)?.n ?? desde;
  return {
    lineas: lineas.map((l) => ({ n: l.n, marca: l.marca.toISOString(), etapa: l.etapa, texto: l.texto, nivel: l.nivel })),
    siguiente: ultima,
    terminado: lineas.length === 0 && estaTerminado(estado),
  };
}

function recursosDe(despliegue: Despliegue): VistaDespliegue["recursos"] {
  if (despliegue.cpus === null || despliegue.memoriaMb === null) return null;
  return { cpus: despliegue.cpus, memoriaMb: despliegue.memoriaMb };
}

function vistaEtapa(etapa: EtapaRegistrada): VistaDespliegue["etapas"][number] {
  const duracionMs = etapa.iniciada && etapa.terminada ? etapa.terminada.getTime() - etapa.iniciada.getTime() : null;
  return { nombre: etapa.etapa, estado: etapa.estado, duracionMs };
}
