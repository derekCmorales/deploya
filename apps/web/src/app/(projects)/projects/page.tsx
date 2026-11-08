import type { Metadata } from "next";
import { Suspense } from "react";

import { PanelProyectos } from "./_componentes/panel-proyectos";

export const metadata: Metadata = { title: "Proyectos" };

/** Pantallas 10 (lista + detalle) y 10b (primer proyecto). M3-01. */
export default function ProyectosPage() {
  return (
    <Suspense>
      <PanelProyectos />
    </Suspense>
  );
}
