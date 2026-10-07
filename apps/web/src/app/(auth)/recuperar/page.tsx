import type { Metadata } from "next";

import { FormularioRecuperacion } from "./formulario-recuperacion";

export const metadata: Metadata = { title: "Recuperar contraseña · Deploya" };

/** Pantalla 04 · Recuperar contraseña, paso 1 (patrón A, acceso partido, como 01 y 03). */
export default function RecuperarPage() {
  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[640px_1fr]">
      <section className="grid place-items-center p-6 sm:p-12">
        <FormularioRecuperacion />
      </section>
      <aside aria-hidden className="puntos hidden border-l border-border bg-sunken lg:block" />
    </div>
  );
}
