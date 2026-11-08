"use client";

import { ErrorDePantalla } from "@/components/estados/error-de-pantalla";

/** EST-01c · Último límite con shell: un fallo fuera de los grupos no deja la página en blanco. */
export default function ErrorDeLaWeb({ reset }: { reset: () => void }) {
  return <ErrorDePantalla reset={reset} />;
}
