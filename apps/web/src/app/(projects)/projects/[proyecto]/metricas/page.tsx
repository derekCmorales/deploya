import type { Metadata } from "next";

import { PanelMetricas } from "../../_componentes/panel-metricas";

export const metadata: Metadata = { title: "Métricas" };

/** Pantalla 16 · Métricas del proyecto (SP-10). */
export default async function MetricasPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelMetricas proyectoId={proyecto} />;
}
