import type { Metadata } from "next";

import { Asistente } from "./_componentes/asistente";

export const metadata: Metadata = { title: "Configura tu instalación" };

/** Pantalla 31 · Autoalojado · Configura tu instalación (SP-17). Solo autoalojado; si no aplica, 404. */
export default function ConfigurarPage() {
  return <Asistente />;
}
