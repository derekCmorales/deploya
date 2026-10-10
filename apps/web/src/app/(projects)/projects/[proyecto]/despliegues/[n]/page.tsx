import { PanelDespliegue } from "../../../_componentes/panel-despliegue";

/** Pantallas 12, 12b y 12c. M7-01. */
export default async function DesplieguePage({ params }: { params: Promise<{ proyecto: string; n: string }> }) {
  const { proyecto, n } = await params;
  return <PanelDespliegue proyectoId={proyecto} numeroTexto={n} />;
}
