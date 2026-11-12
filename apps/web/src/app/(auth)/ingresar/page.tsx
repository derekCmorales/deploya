import type { Metadata } from "next";
import { Suspense } from "react";

import { RedirigeConSesion } from "@/components/shell/redirige-con-sesion";

import { FormularioIngreso } from "./formulario-ingreso";
import { IlustracionIngreso } from "./ilustracion-ingreso";

export const metadata: Metadata = { title: "Iniciar sesión" };

/** Pantalla 03 · Iniciar sesión (patrón A, acceso partido, como 01). Estados 03b en el formulario. */
export default function IngresarPage() {
  return (
    <main className="grid min-h-full grid-cols-1 lg:grid-cols-[640px_1fr]">
      <section className="grid place-items-center p-6 sm:p-12">
        <Suspense>
          <RedirigeConSesion />
          <FormularioIngreso />
        </Suspense>
      </section>
      <aside aria-hidden className="puntos hidden place-items-center border-l border-border bg-sunken p-12 lg:grid">
        <IlustracionIngreso className="w-[420px] max-w-full" />
      </aside>
    </main>
  );
}
