"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { MenuUsuario, RUTA_INGRESAR } from "@/components/shell/menu-usuario";
import { NavPanel, RUTA_PLANES } from "@/components/shell/nav-panel";
import { Button } from "@/components/ui/button";
import { useModoInstalacion } from "@/hooks/use-modo-instalacion";
import { hayCobro } from "@/lib/instalacion";

/** Grupo de rutas de las pantallas de acceso (01–05): llevan el header público, sin navegación del panel. */
const GRUPO_ACCESO = "(auth)";
/** El asistente 31 vive en `(auth)` pero su header lleva el dominio de la instalación, sin «Iniciar sesión». */
const ASISTENTE_INSTALACION = "configurar";

const sinSuscripcion = () => () => {};

/** Artboard 31: el dominio en el que se está configurando, en mono a la izquierda del tema. */
function DominioActual() {
  const dominio = useSyncExternalStore(
    sinSuscripcion,
    () => window.location.hostname,
    () => "",
  );
  if (!dominio) return null;
  return <span className="mr-2 font-mono text-xs text-muted-foreground">{dominio}</span>;
}

/** «Planes» del header público; en autoalojado no hay planes (SP-06). */
function EnlacePlanes() {
  const { modo } = useModoInstalacion();
  if (!hayCobro(modo)) return null;
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={RUTA_PLANES}>Planes</Link>
    </Button>
  );
}

/**
 * Elige el marco según el grupo de rutas activo, no según la URL: toda pantalla nueva
 * dentro de `(auth)` recibe el header público sin tocar este archivo.
 * Header público (fichas 01–04): Planes · tema · Iniciar sesión.
 */
export function MarcoApp({ children }: { children: ReactNode }) {
  const [grupo, pantalla] = useSelectedLayoutSegments();

  if (grupo === GRUPO_ACCESO && pantalla === ASISTENTE_INSTALACION) {
    return <AppShell acciones={<DominioActual />}>{children}</AppShell>;
  }

  if (grupo === GRUPO_ACCESO) {
    return (
      <AppShell
        acciones={<EnlacePlanes />}
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

  return (
    <AppShell nav={<NavPanel />} usuario={<MenuUsuario />}>
      {children}
    </AppShell>
  );
}
