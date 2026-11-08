"use client";

import { ErrorDePantalla } from "@/components/estados/error-de-pantalla";

/** EST-01c · Un fallo en (billing) no tumba el panel. */
export default function ErrorDeCobro({ reset }: { reset: () => void }) {
  return <ErrorDePantalla reset={reset} />;
}
