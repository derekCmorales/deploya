import { Ban, BadgeCheck, CalendarClock, CalendarX, CirclePause, type LucideIcon } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";

import type { EstadoSuscripcionValor } from "./estados";

const MAPA: Record<EstadoSuscripcionValor, { texto: string; icono: LucideIcon; variante: BadgeProps["variant"] }> = {
  activa: { texto: "Activa", icono: BadgeCheck, variante: "ok" },
  "por-vencer": { texto: "Por vencer", icono: CalendarClock, variante: "warn" },
  vencida: { texto: "Vencida", icono: CalendarX, variante: "warn" },
  suspendida: { texto: "Suspendida", icono: CirclePause, variante: "bad" },
  cancelada: { texto: "Cancelada", icono: Ban, variante: "muted" },
};

/**
 * Badge canónico del estado de una suscripción (§4.4). Iconos de calendario/insignia,
 * distintos a los de despliegue para que nunca se confundan en el mismo panel.
 */
function EstadoSuscripcion({ estado, size }: { estado: EstadoSuscripcionValor; size?: BadgeProps["size"] }) {
  const { texto, icono: Icono, variante } = MAPA[estado];
  return (
    <Badge variant={variante} size={size}>
      <Icono aria-hidden />
      {texto}
    </Badge>
  );
}

export { EstadoSuscripcion };
