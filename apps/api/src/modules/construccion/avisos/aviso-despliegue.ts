import type { AvisoDespliegue } from "../../notificaciones";
import type { Despliegue, LineaBitacora, ProyectoDesplegable } from "../dominio/despliegue";
import { ETIQUETAS_ETAPA, type EstadoDespliegue } from "../dominio/estados";
import { etapaFallida } from "../dominio/tiempos-despliegue";

/** Hasta dos líneas de la bitácora en el correo de un Fallido (contrato avisos.md). */
export const LINEAS_AVISO_FALLIDO = 2;

type EstadoAvisado = AvisoDespliegue["despliegue"]["estado"];
const ESTADOS_AVISADOS: readonly EstadoDespliegue[] = ["saludable", "fallido"] satisfies EstadoAvisado[];

/** Solo Saludable y Fallido se avisan; Cancelado y Detenido no (regla 2 del contrato). */
export function seAvisa(estado: EstadoDespliegue): estado is EstadoAvisado {
  return ESTADOS_AVISADOS.includes(estado);
}

export interface HechosAviso {
  proyecto: ProyectoDesplegable;
  despliegue: Despliegue & { estado: EstadoAvisado };
  /** El activo del proyecto después del despliegue; solo cuenta en un Fallido. */
  activo: Despliegue | null;
  /** Las últimas líneas de la bitácora; solo cuentan en un Fallido. */
  lineas: readonly LineaBitacora[];
}

/** Traduce un despliegue terminado al aviso del contrato: etiqueta de la etapa y versión que sigue activa. */
export function avisoDeDespliegue({ proyecto, despliegue, activo, lineas }: HechosAviso): AvisoDespliegue {
  const aviso: AvisoDespliegue = {
    usuarioId: proyecto.usuarioId,
    proyecto: { id: proyecto.id, nombre: proyecto.nombre, subdominio: proyecto.subdominio },
    despliegue: {
      numero: despliegue.numero,
      commit: despliegue.commit?.sha ?? "",
      estado: despliegue.estado,
      duracionMs: duracionMs(despliegue),
    },
  };
  if (despliegue.estado === "saludable") return despliegue.url ? { ...aviso, url: despliegue.url } : aviso;
  const etapa = etapaFallida(despliegue) ?? "recepcion";
  return {
    ...aviso,
    fallo: {
      etapa: ETIQUETAS_ETAPA[etapa],
      versionActiva: activo && activo.id !== despliegue.id ? activo.numero : null,
      ultimasLineas: lineas.slice(-LINEAS_AVISO_FALLIDO).map((linea) => `${linea.n} ${linea.texto}`),
    },
  };
}

function duracionMs(despliegue: Despliegue): number {
  const fin = despliegue.terminado ?? despliegue.creado;
  return fin.getTime() - despliegue.creado.getTime();
}
