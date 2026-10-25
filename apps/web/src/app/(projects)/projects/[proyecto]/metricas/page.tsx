import { PanelMetricas } from "../../_componentes/panel-metricas";

/** Pantalla 16 · Métricas del proyecto (SP-10). */
export default async function MetricasPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelMetricas proyectoId={proyecto} />;
}
