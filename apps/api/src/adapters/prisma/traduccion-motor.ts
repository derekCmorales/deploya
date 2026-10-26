import type {
  Artefacto as ArtefactoFila,
  Despliegue as DespliegueFila,
  EstadoEtapa as EstadoEtapaPrisma,
  EtapaDespliegue as EtapaFila,
  LineaBitacora as LineaFila,
  Prisma,
  Proyecto as ProyectoFila,
} from "@prisma/client";
import type { Artefacto, Despliegue, LineaBitacora } from "../../modules/construccion/dominio/despliegue";
import { ETAPAS, type EstadoEtapa } from "../../modules/construccion/dominio/estados";
import type { Proyecto } from "../../modules/proyectos/dominio/proyecto";

/** Prisma nombra los enums con `_` donde el contrato usa `-` (`en_curso` ↔ `en-curso`). */
export function estadoEtapaAPrisma(estado: EstadoEtapa): EstadoEtapaPrisma {
  return estado.replaceAll("-", "_") as EstadoEtapaPrisma;
}

export function estadoEtapaDesdePrisma(estado: EstadoEtapaPrisma): EstadoEtapa {
  return estado.replaceAll("_", "-") as EstadoEtapa;
}

function numeroODecimal(valor: Prisma.Decimal | null): number | null {
  return valor === null ? null : valor.toNumber();
}

export type DespliegueConEtapas = DespliegueFila & { etapas: EtapaFila[] };

export function despliegueDesdePrisma(fila: DespliegueConEtapas): Despliegue {
  const etapas = [...fila.etapas].sort((a, b) => ETAPAS.indexOf(a.etapa) - ETAPAS.indexOf(b.etapa));
  return {
    id: fila.id,
    proyectoId: fila.proyectoId,
    numero: fila.numero,
    estado: fila.estado,
    disparador: fila.disparador,
    rama: fila.rama,
    commit: fila.commitSha ? { sha: fila.commitSha, mensaje: fila.commitMensaje ?? "", autor: fila.commitAutor ?? "" } : null,
    artefactoId: fila.artefactoId,
    contenedorId: fila.contenedorId,
    url: fila.url,
    cpus: numeroODecimal(fila.cpus),
    memoriaMb: fila.memoriaMb,
    codigoSalida: fila.codigoSalida,
    motivoFallo: fila.motivoFallo,
    creado: fila.creado,
    terminado: fila.terminado,
    etapas: etapas.map((e) => ({
      etapa: e.etapa,
      estado: estadoEtapaDesdePrisma(e.estado),
      iniciada: e.iniciada,
      terminada: e.terminada,
    })),
  };
}

export function lineaDesdePrisma(fila: LineaFila): LineaBitacora {
  return { n: fila.n, marca: fila.marca, etapa: fila.etapa, nivel: fila.nivel, texto: fila.texto };
}

export function artefactoDesdePrisma(fila: ArtefactoFila): Artefacto {
  return {
    id: fila.id,
    proyectoId: fila.proyectoId,
    numero: fila.numero,
    imagen: fila.imagen,
    digest: fila.digest,
    tamanoBytes: Number(fila.tamanoBytes),
    commitSha: fila.commitSha,
    receta: fila.receta,
    disponible: fila.disponible,
    creado: fila.creado,
  };
}

export function proyectoDesdePrisma(fila: ProyectoFila): Proyecto {
  return {
    id: fila.id,
    usuarioId: fila.usuarioId,
    nombre: fila.nombre,
    subdominio: fila.subdominio,
    urlRepositorio: fila.urlRepositorio,
    rama: fila.rama,
    rutaDockerfile: fila.rutaDockerfile,
    puertoInterno: fila.puertoInterno,
    creado: fila.creado,
  };
}
