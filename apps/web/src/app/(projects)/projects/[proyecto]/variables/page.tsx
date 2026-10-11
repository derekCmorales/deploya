import { PanelVariables } from "../../_componentes/panel-variables";

/** Pantalla 17. M3-03. */
export default async function VariablesPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelVariables proyectoId={proyecto} />;
}
