import type { Metadata } from "next";

import { PlanesContenedor } from "./_componentes/planes-contenedor";

export const metadata: Metadata = { title: "Planes · Deploya" };

export default function PlanesPage() {
  return <PlanesContenedor />;
}
