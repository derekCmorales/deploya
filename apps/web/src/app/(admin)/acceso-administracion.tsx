"use client";

import { RotateCw } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { SinPermisos } from "@/components/estados/sin-permisos";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSesion } from "@/hooks/use-sesion";
import { nombreRol, type AccesoAdministracion } from "@/lib/acceso";
import { consultarAccesoAdministracion } from "@/lib/api-administracion";

/**
 * M1-04: antes de mostrar `(admin)` pregunta a la API (`RolGuard`), no decide en el
 * cliente. Un Cliente ve la pantalla 28 · 403. Un 401 lo avisa `pedirApi`: `SesionProvider`
 * vuelve a leer la sesión y `RequiereSesion` lleva a `/ingresar`.
 */
export function AccesoAdministracionGuard({ children }: { children: ReactNode }) {
  const { usuario } = useSesion();
  const [acceso, setAcceso] = useState<AccesoAdministracion | null>(null);

  const consultar = useCallback(async () => {
    setAcceso(null);
    setAcceso(await consultarAccesoAdministracion().catch((): AccesoAdministracion => "error"));
  }, []);

  useEffect(() => {
    void consultar();
  }, [consultar]);

  if (acceso === "permitido") return <>{children}</>;
  if (acceso === "solo-administracion") return <SinPermisos rol={nombreRol(usuario?.rol)} />;
  if (acceso === "error") {
    return (
      <div className="px-8 pt-6">
        <Banner
          variant="bad"
          title="No pudimos comprobar tu acceso."
          actions={
            <Button variant="outline" size="sm" onClick={() => void consultar()}>
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
    <div className="flex flex-col gap-3 px-8 pt-6" aria-busy="true" aria-label="Comprobando el acceso">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48" />
    </div>
  );
}
