import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { FormularioRestablecer } from "./formulario-restablecer";

export const metadata: Metadata = { title: "Nueva contraseña · Deploya" };

/** Pantalla 04 · paso 2 (`/restablecer?token=`), patrón B como 02. */
export default function RestablecerPage() {
  return (
    <div className="puntos grid min-h-full place-items-center bg-sunken p-6">
      <Suspense fallback={<Skeleton className="h-96 w-[400px] max-w-full rounded-xl" />}>
        <FormularioRestablecer />
      </Suspense>
    </div>
  );
}
