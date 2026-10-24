import type { Metadata } from "next";

import { InstalacionContenedor } from "./_componentes/instalacion-contenedor";

export const metadata: Metadata = { title: "Instalación · Administración · Deploya" };

/** 32 · solo autoalojado. La sesión y el rol los exige el layout de `(admin)`; la API da 404 en la nube. */
export default function InstalacionAdminPage() {
  return <InstalacionContenedor />;
}
