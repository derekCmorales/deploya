import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { Verificacion } from "./verificacion";

export const metadata: Metadata = { title: "Verifica tu correo · Deploya" };

/** Pantalla 02 · Verifica tu correo (patrón B, tarjeta de estado). */
export default function VerificarPage() {
  return (
    <div className="puntos grid min-h-full place-items-center bg-sunken p-6">
      <Suspense fallback={<Skeleton className="h-64 w-[400px] max-w-full rounded-xl" />}>
        <Verificacion />
      </Suspense>
    </div>
  );
}
