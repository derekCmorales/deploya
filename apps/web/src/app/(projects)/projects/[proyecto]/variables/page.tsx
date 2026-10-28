import type { Metadata } from "next";

import { PanelVariables } from "../../_componentes/panel-variables";

export const metadata: Metadata = { title: "Variables" };

/** Pantalla 17. M3-03. */
export default async function VariablesPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelVariables proyectoId={proyecto} />;
}
