import type { Metadata } from "next";

import { PanelBitacoras } from "../../_componentes/panel-bitacoras";

export const metadata: Metadata = { title: "Bitácoras" };

/** Pantalla 15 · Bitácoras de ejecución (SP-12). */
export default async function BitacorasPage({ params }: { params: Promise<{ proyecto: string }> }) {
  const { proyecto } = await params;
  return <PanelBitacoras proyectoId={proyecto} />;
}
