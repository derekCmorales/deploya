"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { useModoInstalacion } from "@/hooks/use-modo-instalacion";
import { hayCobro } from "@/lib/instalacion";

/** En autoalojado no hay cobro (SP-06): Suscripción, Planes y Pagos responden la 404 de la pantalla 28. */
export function SoloEnNube({ children }: { children: ReactNode }) {
  const { modo } = useModoInstalacion();
  if (!hayCobro(modo)) notFound();
  return children;
}
