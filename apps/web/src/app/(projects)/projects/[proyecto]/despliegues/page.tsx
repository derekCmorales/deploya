import { PanelHistorial } from "../../_componentes/panel-historial";

/** Pantalla 14 · Despliegues del proyecto (M7-02, M4-02, M5-04). */
export default async function DesplieguesPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelHistorial proyectoId={proyecto} />;
}
