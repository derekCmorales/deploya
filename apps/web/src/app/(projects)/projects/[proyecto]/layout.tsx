import type { ReactNode } from "react";

import { MarcoProyecto } from "../_componentes/marco-proyecto";

/** Layout de un proyecto: cabecera y pestañas. El detalle (12, 17, …) va en `children`. */
export default async function ProyectoLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ proyecto: string }>;
}) {
  const { proyecto } = await params;
  return (
    <div className="flex min-h-full flex-col">
      <MarcoProyecto proyectoId={proyecto} />
      {children}
    </div>
  );
}
