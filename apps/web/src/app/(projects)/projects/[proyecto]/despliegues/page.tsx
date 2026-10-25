import { PanelHistorial } from "../../_componentes/panel-historial";
import { TarjetaTiempos } from "../../_componentes/tarjeta-tiempos";

/** Pantalla 14 · Despliegues del proyecto (M7-02, M4-02, M5-04, SP-14). */
export default async function DesplieguesPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;

  return (
    <>
      <TarjetaTiempos proyectoId={proyecto} />
      <PanelHistorial proyectoId={proyecto} />
    </>
  );
}
