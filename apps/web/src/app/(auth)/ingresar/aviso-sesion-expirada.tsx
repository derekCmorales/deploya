"use client";

import { useSearchParams } from "next/navigation";

import { Banner } from "@/components/ui/banner";
import { PARAMETRO_EXPIRADA } from "@/lib/sesion-expirada";

/** Pantalla 28 · Sesión expirada: llega con `/ingresar?expirada=1` desde `RequiereSesion`. */
export function AvisoSesionExpirada() {
  if (useSearchParams().get(PARAMETRO_EXPIRADA) !== "1") return null;
  return (
    <Banner variant="warn" title="Tu sesión expiró">
      Por seguridad cerramos las sesiones tras 7 días sin actividad. Inicia sesión de nuevo y volverás a esta página.
    </Banner>
  );
}
