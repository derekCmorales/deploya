import type { Metadata } from "next";

import { Seguridad } from "../_componentes/seguridad";

export const metadata: Metadata = { title: "Seguridad · Mi cuenta · Deploya" };

/** Pantalla 05b · Mi cuenta · Seguridad (M1-07). */
export default function SeguridadPage() {
  return <Seguridad />;
}
