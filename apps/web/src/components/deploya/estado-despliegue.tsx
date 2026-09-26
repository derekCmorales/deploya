import { Ban, CircleCheck, CircleStop, CircleX, Clock, LoaderCircle, type LucideIcon } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";

import type { EstadoDespliegueValor } from "./estados";

const MAPA: Record<EstadoDespliegueValor, { texto: string; icono: LucideIcon; variante: BadgeProps["variant"]; gira?: boolean }> = {
  encolado: { texto: "Encolado", icono: Clock, variante: "muted" },
  construyendo: { texto: "Construyendo", icono: LoaderCircle, variante: "signal", gira: true },
  aprovisionando: { texto: "Aprovisionando", icono: LoaderCircle, variante: "signal", gira: true },
  publicando: { texto: "Publicando", icono: LoaderCircle, variante: "signal", gira: true },
  saludable: { texto: "Saludable", icono: CircleCheck, variante: "ok" },
  fallido: { texto: "Fallido", icono: CircleX, variante: "bad" },
  cancelado: { texto: "Cancelado", icono: Ban, variante: "muted" },
  detenido: { texto: "Detenido", icono: CircleStop, variante: "muted" },
};

/** Badge canónico del estado de un despliegue: palabra, icono y tono fijos. */
function EstadoDespliegue({ estado, size }: { estado: EstadoDespliegueValor; size?: BadgeProps["size"] }) {
  const { texto, icono: Icono, variante, gira } = MAPA[estado];
  return (
    <Badge variant={variante} size={size}>
      <Icono aria-hidden className={gira ? "animate-spin" : undefined} />
      {texto}
    </Badge>
  );
}

export { EstadoDespliegue };
