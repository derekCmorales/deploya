"use client";

import { ErrorDePantalla } from "@/components/estados/error-de-pantalla";

/** EST-01c · Un fallo en (projects) no tumba el panel ni el proyecto abierto. */
export default function ErrorDeProyectos({ reset }: { reset: () => void }) {
  return <ErrorDePantalla reset={reset} />;
}
