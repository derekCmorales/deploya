"use client";

import { usePathname } from "next/navigation";

import { ErrorConexionApi } from "@/components/estados/error-conexion-api";

const ERROR_DE_RENDER = { codigo: "error-de-render" } as const;

/**
 * EST-01c · Límite de error de un grupo de rutas. Adapta el contrato de `error.tsx` de Next
 * (`reset`) al estado 28 del design system, dentro del shell: no hay un estado nuevo, es el
 * mismo `ErrorConexionApi` con la copia de un fallo de render y sin reintento automático,
 * porque un error de dibujo se repite hasta que cambie el código.
 */
export function ErrorDePantalla({ reset }: { reset: () => void }) {
  const ruta = usePathname();
  return (
    <div className="px-8 py-10">
      <ErrorConexionApi
        error={ERROR_DE_RENDER}
        ruta={ruta}
        onReintentar={reset}
        titulo="Algo falló al dibujar esta pantalla"
        descripcion="Tus servicios siguen en línea. Vuelve a intentarlo; si sigue igual, recarga la página."
        reintentoAutomatico={false}
      />
    </div>
  );
}
