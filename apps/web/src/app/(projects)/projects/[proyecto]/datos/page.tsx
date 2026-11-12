import type { Metadata } from "next";

import { PanelDatos } from "../../_componentes/panel-datos";

export const metadata: Metadata = { title: "Datos" };

/** Pantalla 18 · Datos del proyecto: bases administradas (feat/m5-recursos-datos). */
export default async function DatosPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelDatos proyectoId={proyecto} />;
}
