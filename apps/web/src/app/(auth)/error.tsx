"use client";

import { ErrorDePantalla } from "@/components/estados/error-de-pantalla";

/** EST-01c · Un fallo en (auth) no tumba el shell público. */
export default function ErrorDeAcceso({ reset }: { reset: () => void }) {
  return <ErrorDePantalla reset={reset} />;
}
