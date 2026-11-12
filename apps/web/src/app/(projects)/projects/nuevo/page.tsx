import type { Metadata } from "next";

import { AsistenteAlta } from "../_componentes/asistente-alta";

export const metadata: Metadata = { title: "Nuevo proyecto" };

/**
 * Pantallas 11a (Repositorio), 11d (Revisar) y 11e (errores). M3-02.
 * La región principal llena el cuerpo del shell para que el lateral del asistente llegue hasta abajo.
 */
export default function NuevoProyectoPage() {
  return (
    <main className="flex min-h-full flex-col">
      <AsistenteAlta />
    </main>
  );
}
