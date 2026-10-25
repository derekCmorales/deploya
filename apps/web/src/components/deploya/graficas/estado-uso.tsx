import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EstadoUso } from "@/lib/metricas";

const TONO: Record<EstadoUso, "ok" | "warn" | "bad"> = {
  Holgada: "ok",
  "Cerca del límite": "warn",
  "Al límite": "bad",
};

const ICONO: Record<EstadoUso, LucideIcon> = {
  Holgada: CircleCheck,
  "Cerca del límite": TriangleAlert,
  "Al límite": CircleAlert,
};

/** Estado del uso en palabra e icono, nunca solo color (README § Color). */
export function EstadoUsoBadge({ estado }: { estado: EstadoUso }) {
  const Icono = ICONO[estado];
  return (
    <Badge variant={TONO[estado]}>
      <Icono aria-hidden />
      {estado}
    </Badge>
  );
}
