import Link from "next/link";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/deploya/wordmark";
import { ThemeToggle } from "@/components/shell/theme-toggle";

/**
 * Marco raíz v4.1: header de 56px con la marca «deploya», navegación, acciones,
 * cambio de tema y usuario. El cuerpo tiene scroll propio. Deploya.
 */
export function AppShell({
  children,
  nav,
  acciones,
  usuario,
}: {
  children: ReactNode;
  /** Navegación principal (p. ej. `<NavPrincipal items={…} />`). */
  nav?: ReactNode;
  /** Acciones a la derecha, antes del tema (búsqueda, chip de despliegue). */
  acciones?: ReactNode;
  /** Menú del usuario o botón «Iniciar sesión». */
  usuario?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="relative z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background pr-4 pl-6">
        <Link href="/" aria-label="deploya, inicio" className="rounded-sm px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Wordmark />
        </Link>
        {nav}
        <span className="flex-1" />
        {acciones}
        <ThemeToggle />
        {usuario}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
