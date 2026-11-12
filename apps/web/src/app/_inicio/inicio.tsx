"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { RequiereSesion } from "@/components/shell/requiere-sesion";
import { Skeleton } from "@/components/ui/skeleton";
import { useModoInstalacion } from "@/hooks/use-modo-instalacion";
import { useSesion } from "@/hooks/use-sesion";
import { URL_LANDING } from "@/lib/api";
import { destinoRaizSinSesion } from "@/lib/inicio";

import { PanelInicio } from "./panel-inicio";

/**
 * Raíz de la app. Sin sesión (y sin que haya vencido) lleva a la landing en la nube o a
 * `/ingresar`; la sesión vencida, la falta de conexión y la carga las resuelve `RequiereSesion`.
 */
export function Inicio() {
  const { estado, expirada } = useSesion();
  const { modo, cargando } = useModoInstalacion();
  const router = useRouter();
  const sinSesion = estado === "sin-sesion" && !expirada;

  useEffect(() => {
    if (!sinSesion || cargando) return;
    const destino = destinoRaizSinSesion(modo, URL_LANDING);
    if (destino.startsWith("/")) router.replace(destino);
    else window.location.replace(destino);
  }, [sinSesion, cargando, modo, router]);

  if (sinSesion) {
    return (
      <div className="flex flex-col gap-3 px-8 pt-7" aria-busy aria-label="Abriendo deploya">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
      </div>
    );
  }

  return (
    <RequiereSesion>
      <PanelInicio />
    </RequiereSesion>
  );
}
