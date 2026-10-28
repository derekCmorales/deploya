"use client";

import { ErrorDePantalla } from "@/components/estados/error-de-pantalla";

/** EST-01c · Un fallo en (admin) no tumba el panel. */
export default function ErrorDeAdministracion({ reset }: { reset: () => void }) {
  return <ErrorDePantalla reset={reset} />;
}
