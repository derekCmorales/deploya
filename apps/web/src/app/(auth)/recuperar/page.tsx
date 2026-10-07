import type { Metadata } from "next";

import { FormularioRecuperacion } from "./formulario-recuperacion";

export const metadata: Metadata = { title: "Recuperar contraseña · Deploya" };

/** Pantalla 04 · Recuperar contraseña, paso 1 (patrón B, tarjeta centrada). */
export default function RecuperarPage() {
  return (
    <div className="puntos grid min-h-full place-items-center bg-sunken p-6">
      <FormularioRecuperacion />
    </div>
  );
}
