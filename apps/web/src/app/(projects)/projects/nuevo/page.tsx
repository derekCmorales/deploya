import type { Metadata } from "next";

import { AsistenteAlta } from "../_componentes/asistente-alta";

export const metadata: Metadata = { title: "Nuevo proyecto" };

/** Pantallas 11a (Repositorio), 11d (Revisar) y 11e (errores). M3-02. */
export default function NuevoProyectoPage() {
  return <AsistenteAlta />;
}
