import type { BadgeProps } from "@/components/ui/badge";
import type { EstadoDespliegue, EtapaCiclo } from "@/lib/mock/proyectos";
import { ETAPAS_CICLO } from "@/lib/mock/proyectos";

export function varianteEstado(
  estado: EstadoDespliegue,
): NonNullable<BadgeProps["variant"]> {
  switch (estado) {
    case "Saludable":
      return "success";
    case "Fallido":
      return "danger";
    case "Construyendo":
    case "Aprovisionando":
    case "Publicando":
    case "Revirtiendo":
      return "warning";
    case "Detenido":
    case "Encolado":
      return "muted";
    default:
      return "secondary";
  }
}

export function indiceEtapa(etapa: EtapaCiclo): number {
  return ETAPAS_CICLO.indexOf(etapa);
}

export function etapaCompletada(actual: EtapaCiclo, candidata: EtapaCiclo) {
  return indiceEtapa(candidata) < indiceEtapa(actual);
}
