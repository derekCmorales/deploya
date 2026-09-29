"use client";

import { CreditCard, FolderGit2, LayoutTemplate, UserRound } from "lucide-react";

import { NavPrincipal, type ItemNav } from "@/components/shell/nav-principal";

/** Planes aparece en el panel y en el header público de las pantallas de acceso. */
export const RUTA_PLANES = "/planes";

/**
 * Navegación del panel. Cada dueño cambia su `href` cuando su ruta real exista
 * (rutas objetivo en docs/diseno/guia-construccion.md).
 */
export const NAV_PANEL: ItemNav[] = [
  { href: "/projects", texto: "Proyectos", icono: FolderGit2 },
  { href: RUTA_PLANES, texto: "Planes", icono: CreditCard },
  { href: "/registro", texto: "Cuenta", icono: UserRound },
  { href: "/sistema", texto: "Sistema", icono: LayoutTemplate },
];

export function NavPanel() {
  return <NavPrincipal items={NAV_PANEL} />;
}
