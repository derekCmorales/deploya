import type { ReactNode } from "react";

import { RequiereSesion } from "@/components/shell/requiere-sesion";

import { AccesoAdministracionGuard } from "./acceso-administracion";

/** Todo el grupo `(admin)` exige sesión (M1-03) y rol Administrador según la API (M1-04). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequiereSesion>
      <AccesoAdministracionGuard>{children}</AccesoAdministracionGuard>
    </RequiereSesion>
  );
}
