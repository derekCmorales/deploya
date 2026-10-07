import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { FormularioRestablecer } from "./formulario-restablecer";

export const metadata: Metadata = { title: "Nueva contraseña · Deploya" };

/** Pantalla 04 · paso 2 (`/restablecer?token=`), patrón A como el paso 1. */
export default function RestablecerPage() {
  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[640px_1fr]">
      <section className="grid place-items-center p-6 sm:p-12">
        <Suspense fallback={<Skeleton className="h-96 w-[400px] max-w-full rounded-xl" />}>
          <FormularioRestablecer />
        </Suspense>
      </section>
      <aside aria-hidden className="puntos hidden border-l border-border bg-sunken lg:block" />
    </div>
  );
}
