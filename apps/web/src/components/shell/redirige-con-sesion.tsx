"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useSesion } from "@/hooks/use-sesion";
import { destinoTrasIngreso } from "@/lib/cuenta";

/**
 * Pantallas de acceso (01, 03): quien ya tiene sesión y llega desde la landing va directo al
 * panel (o a `?siguiente=`), sin volver a escribir su contraseña. Va dentro de un `Suspense`.
 */
export function RedirigeConSesion() {
  const { estado } = useSesion();
  const router = useRouter();
  const destino = destinoTrasIngreso(useSearchParams().get("siguiente"));

  useEffect(() => {
    if (estado === "con-sesion") router.replace(destino);
  }, [estado, destino, router]);

  return null;
}
