"use client";

import { ErrorConexionApi } from "@/components/estados/error-conexion-api";

import "./globals.css";

const ERROR_GLOBAL = { codigo: "error-global" } as const;

/**
 * EST-01c · Último recurso: si falla el layout raíz no hay shell ni tema. Se dibuja la página
 * mínima con los tokens y el estado 28, sin reintento automático.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="es">
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <main className="mx-auto flex min-h-dvh max-w-3xl items-center px-8">
          <ErrorConexionApi
            error={ERROR_GLOBAL}
            onReintentar={reset}
            titulo="Algo falló al dibujar Deploya"
            descripcion="Vuelve a intentarlo; si sigue igual, recarga la página."
            reintentoAutomatico={false}
          />
        </main>
      </body>
    </html>
  );
}
