import { CircleCheck, CircleStop, CircleX, LoaderCircle, type LucideIcon } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";

import type { EstadoRecursoDatosValor } from "./estados";

const MAPA: Record<EstadoRecursoDatosValor, { texto: string; icono: LucideIcon; variante: BadgeProps["variant"]; gira?: boolean }> = {
  creando: { texto: "Creando", icono: LoaderCircle, variante: "signal", gira: true },
  disponible: { texto: "Disponible", icono: CircleCheck, variante: "ok" },
  detenido: { texto: "Detenido", icono: CircleStop, variante: "muted" },
  error: { texto: "Error", icono: CircleX, variante: "bad" },
};

/** Badge canónico del estado de un recurso de datos (pestaña Datos, 18): palabra, icono y tono fijos. */
function EstadoRecursoDatos({ estado, size }: { estado: EstadoRecursoDatosValor; size?: BadgeProps["size"] }) {
  const { texto, icono: Icono, variante, gira } = MAPA[estado];
  return (
    <Badge variant={variante} size={size}>
      <Icono aria-hidden className={gira ? "animate-spin" : undefined} />
      {texto}
    </Badge>
  );
}

export { EstadoRecursoDatos };
