"use client";

import { RotateCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { RUTA_INGRESAR } from "@/components/shell/menu-usuario";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSesion } from "@/hooks/use-sesion";

/** Rutas del panel (M1-03): sin sesión vigente se va a `/ingresar` y se vuelve después. */
export function RequiereSesion({ children }: { children: ReactNode }) {
  const { estado, recargar } = useSesion();
  const router = useRouter();
  const ruta = usePathname();

  useEffect(() => {
    if (estado === "sin-sesion") router.replace(`${RUTA_INGRESAR}?siguiente=${encodeURIComponent(ruta)}`);
  }, [estado, ruta, router]);

  if (estado === "con-sesion") return <>{children}</>;
  if (estado === "sin-conexion") {
    return (
      <div className="px-8 pt-6">
        <Banner
          variant="bad"
          title="No pudimos conectar con la API."
          actions={
            <Button variant="outline" size="sm" onClick={() => void recargar()}>
              <RotateCw />
              Reintentar
            </Button>
          }
        >
          Revisa tu conexión e intenta de nuevo.
        </Banner>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 px-8 pt-6" aria-busy="true" aria-label="Comprobando la sesión">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
