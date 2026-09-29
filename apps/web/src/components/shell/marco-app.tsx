"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { NavPanel, RUTA_PLANES } from "@/components/shell/nav-panel";
import { Button } from "@/components/ui/button";

/** Grupo de rutas de las pantallas de acceso (01–05): llevan el header público, sin navegación del panel. */
const GRUPO_ACCESO = "(auth)";
const RUTA_INGRESAR = "/ingresar";

/**
 * Elige el marco según el grupo de rutas activo, no según la URL: toda pantalla nueva
 * dentro de `(auth)` recibe el header público sin tocar este archivo.
 * Header público (fichas 01–04): Planes · tema · Iniciar sesión.
 */
export function MarcoApp({ children }: { children: ReactNode }) {
  const grupo = useSelectedLayoutSegment();

  if (grupo === GRUPO_ACCESO) {
    return (
      <AppShell
        acciones={
          <Button asChild variant="ghost" size="sm">
            <Link href={RUTA_PLANES}>Planes</Link>
          </Button>
        }
        usuario={
          <Button asChild variant="outline" size="sm">
            <Link href={RUTA_INGRESAR}>Iniciar sesión</Link>
          </Button>
        }
      >
        {children}
      </AppShell>
    );
  }

  return <AppShell nav={<NavPanel />}>{children}</AppShell>;
}
