import type { Metadata } from "next";

import { FormularioRegistro } from "./formulario-registro";

export const metadata: Metadata = { title: "Crear cuenta · Deploya" };

/** Pantalla 01 · Registro (patrón A, acceso partido). Estados 01b en el formulario. */
export default function RegistroPage() {
  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[640px_1fr]">
      <section className="grid place-items-center p-6 sm:p-12">
        <FormularioRegistro />
      </section>
      <aside aria-hidden className="puntos hidden border-l border-border bg-sunken lg:block" />
    </div>
  );
}
