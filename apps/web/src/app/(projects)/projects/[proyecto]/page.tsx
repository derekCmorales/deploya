import { PanelResumen } from "../_componentes/panel-resumen";

/** Pantalla 13 · Resumen del proyecto (M7-02). */
export default async function ResumenPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelResumen proyectoId={proyecto} />;
}
