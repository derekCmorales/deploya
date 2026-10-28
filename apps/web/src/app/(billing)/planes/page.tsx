import type { Metadata } from "next";

import { PlanesContenedor } from "./_componentes/planes-contenedor";

export const metadata: Metadata = { title: "Planes" };

export default function PlanesPage() {
  return <PlanesContenedor />;
}
