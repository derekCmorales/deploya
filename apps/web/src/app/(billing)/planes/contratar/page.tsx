import type { Metadata } from "next";
import { Suspense } from "react";

import { RequiereSesion } from "@/components/shell/requiere-sesion";

import { ContratarContenedor } from "./_componentes/contratar-contenedor";

export const metadata: Metadata = { title: "Contratar plan · Deploya" };

/** 07 y 07b. `Suspense` porque el contenedor lee `?plan=&vigencia=` con `useSearchParams`. */
export default function ContratarPage() {
  return (
    <RequiereSesion>
      <Suspense>
        <ContratarContenedor />
      </Suspense>
    </RequiereSesion>
  );
}
