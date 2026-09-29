import type { ReactNode } from "react";

import { RequiereSesion } from "@/components/shell/requiere-sesion";

/** Todo el grupo `(projects)` exige sesión (M1-03). */
export default function ProyectosLayout({ children }: { children: ReactNode }) {
  return <RequiereSesion>{children}</RequiereSesion>;
}
