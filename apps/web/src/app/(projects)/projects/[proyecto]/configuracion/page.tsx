import type { Metadata } from "next";

import { PanelConfiguracion } from "../../_componentes/panel-configuracion";

export const metadata: Metadata = { title: "Configuración" };

/** Pantalla 19 · Configuración del proyecto (M3-04). */
export default async function ConfiguracionPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelConfiguracion proyectoId={proyecto} />;
}
