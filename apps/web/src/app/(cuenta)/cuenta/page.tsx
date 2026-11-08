import type { Metadata } from "next";

import { Perfil } from "./_componentes/perfil";

export const metadata: Metadata = { title: "Mi cuenta" };

/** Pantalla 05 · Mi cuenta · Perfil (M1-06). */
export default function CuentaPage() {
  return <Perfil />;
}
