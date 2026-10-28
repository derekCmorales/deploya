import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { FormularioRegistro } from "./formulario-registro";
import { IlustracionRegistro } from "./ilustracion-registro";

export const metadata: Metadata = { title: "Crear cuenta" };

/**
 * Pantalla 01 · Registro (patrón A, acceso partido). Estados 01b en el formulario. `Suspense`
 * porque el formulario lee `?invitacion=` (SP-18) con `useSearchParams`.
 */
export default function RegistroPage() {
  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[640px_1fr]">
      <section className="grid place-items-center p-6 sm:p-12">
        <Suspense fallback={<Skeleton className="h-96 w-[400px] max-w-full rounded-xl" />}>
          <FormularioRegistro />
        </Suspense>
      </section>
      <aside aria-hidden className="puntos hidden place-items-center border-l border-border bg-sunken p-12 lg:grid">
        <IlustracionRegistro className="w-[430px] max-w-full" />
      </aside>
    </div>
  );
}
