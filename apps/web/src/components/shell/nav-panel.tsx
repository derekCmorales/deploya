"use client";

import { CreditCard, FolderGit2, LayoutTemplate, ShieldCheck, UserRound } from "lucide-react";

import { NavPrincipal, type ItemNav } from "@/components/shell/nav-principal";
import { useModoInstalacion } from "@/hooks/use-modo-instalacion";
import { useSesion } from "@/hooks/use-sesion";
import { navegacionSegunModo } from "@/lib/instalacion";

/** Planes aparece en el panel y en el header público de las pantallas de acceso. */
export const RUTA_PLANES = "/planes";

/**
 * Navegación del panel. Cada dueño cambia su `href` cuando su ruta real exista
 * (rutas objetivo en docs/diseno/guia-construccion.md).
 */
export const NAV_PANEL: ItemNav[] = [
  { href: "/projects", texto: "Proyectos", icono: FolderGit2 },
  { href: "/suscripcion", texto: "Suscripción", icono: CreditCard, activoEn: [RUTA_PLANES, "/pagos"] },
  { href: "/cuenta", texto: "Cuenta", icono: UserRound },
  { href: "/sistema", texto: "Sistema", icono: LayoutTemplate },
];

/** Solo para el rol Administrador (25); la API lo vuelve a exigir con `RolGuard`. */
export const NAV_ADMINISTRACION: ItemNav = { href: "/admin/usuarios", texto: "Administración", icono: ShieldCheck, activoEn: ["/admin"] };

/** En autoalojado no aparece Suscripción (SP-06). */
export function NavPanel() {
  const { usuario } = useSesion();
  const { modo } = useModoInstalacion();
  return <NavPrincipal items={navegacionSegunModo(usuario?.rol === "administrador" ? [...NAV_PANEL, NAV_ADMINISTRACION] : NAV_PANEL, modo)} />;
}
