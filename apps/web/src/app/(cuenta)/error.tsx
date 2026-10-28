"use client";

import { ErrorDePantalla } from "@/components/estados/error-de-pantalla";

/** EST-01c · Un fallo en (cuenta) no tumba el panel. */
export default function ErrorDeCuenta({ reset }: { reset: () => void }) {
  return <ErrorDePantalla reset={reset} />;
}
