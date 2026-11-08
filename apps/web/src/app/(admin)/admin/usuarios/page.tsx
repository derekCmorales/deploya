import type { Metadata } from "next";

import { UsuariosContenedor } from "./_componentes/usuarios-contenedor";

export const metadata: Metadata = { title: "Usuarios · Administración" };

/** 25 y 25b. La sesión y el rol los exige el layout de `(admin)`. */
export default function UsuariosAdminPage() {
  return <UsuariosContenedor />;
}
