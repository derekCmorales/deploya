import type { Metadata } from "next";

import { InfraestructuraContenedor } from "./_componentes/infraestructura-contenedor";

export const metadata: Metadata = { title: "Infraestructura · Administración" };

/** 27 · solo lectura. La sesión y el rol los exige el layout de `(admin)`; la API vuelve a exigirlos. */
export default function InfraestructuraAdminPage() {
  return <InfraestructuraContenedor />;
}
