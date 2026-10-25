import type { AvisoDespliegue } from "../../notificaciones";
import type { Despliegue, LineaBitacora, ProyectoDesplegable } from "../dominio/despliegue";
import type { EstadoDespliegue, Etapa } from "../dominio/estados";

/** Estados que 24b avisa por correo; Cancelado y Detenido no (contrato avisos.md). */
export type EstadoAvisable = Extract<EstadoDespliegue, "saludable" | "fallido">;

/** Las dos últimas líneas de la bitácora que muestra el correo de un fallo (24b). */
export const LINEAS_EN_AVISO = 2;

export const NOMBRE_ETAPA: Record<Etapa, string> = {
  recepcion: "Recepción",
  construccion: "Construcción",
  ejecucion: "Ejecución",
  enrutamiento: "Enrutamiento",
  operacion: "Operación",
};

export function esAvisable(estado: EstadoDespliegue): estado is EstadoAvisable {
  return estado === "saludable" || estado === "fallido";
}

/** Lo que el oyente leyó para un despliegue terminado. */
export interface HechosDespliegue {
  despliegue: Despliegue;
  proyecto: ProyectoDesplegable;
  estado: EstadoAvisable;
  /** Solo Fallido: el número del activo que sigue sirviendo, si lo hay. */
  versionActiva?: number | null;
  /** Solo Fallido: las últimas líneas de la bitácora. */
  ultimasLineas?: LineaBitacora[];
}

/** Arma el `AvisoDespliegue` de 24b (función pura: se prueba sin base ni reloj). */
export function avisoDeDespliegue({ despliegue, proyecto, estado, versionActiva, ultimasLineas }: HechosDespliegue): AvisoDespliegue {
  const aviso: AvisoDespliegue = {
    usuarioId: proyecto.usuarioId,
    proyecto: { id: proyecto.id, nombre: proyecto.nombre, subdominio: proyecto.subdominio },
    despliegue: { numero: despliegue.numero, commit: despliegue.commit?.sha ?? "", estado, duracionMs: duracionDe(despliegue) },
  };
  if (estado === "saludable") return despliegue.url ? { ...aviso, url: despliegue.url } : aviso;
  return {
    ...aviso,
    fallo: {
      etapa: NOMBRE_ETAPA[etapaFallida(despliegue)],
      versionActiva: versionActiva ?? null,
      ultimasLineas: (ultimasLineas ?? []).map((linea) => `${linea.n} ${linea.texto}`),
    },
  };
}

function duracionDe({ creado, terminado }: Despliegue): number {
  return terminado ? Math.max(0, terminado.getTime() - creado.getTime()) : 0;
}

/** La etapa marcada como fallida; si no quedó marca (falló antes de empezar), Recepción. */
function etapaFallida(despliegue: Despliegue): Etapa {
  return despliegue.etapas.find((etapa) => etapa.estado === "fallida")?.etapa ?? "recepcion";
}
