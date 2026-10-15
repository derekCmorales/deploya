import type { ReactNode } from "react";

import { RequiereSesion } from "@/components/shell/requiere-sesion";

import { CabeceraCuenta } from "./cuenta/_componentes/cabecera-cuenta";

/**
 * Mi cuenta (05 y 05b, M1-06 y M1-07): exige sesión y va con el panel. No vive en `(auth)`,
 * que lleva el header público.
 */
export default function CuentaLayout({ children }: { children: ReactNode }) {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-8 pt-7 pb-12">
        <CabeceraCuenta />
        {children}
      </main>
    </RequiereSesion>
  );
}
