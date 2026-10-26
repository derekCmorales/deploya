"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useModoInstalacion } from "@/hooks/use-modo-instalacion";
import { debeIrAConfigurar, RUTA_CONFIGURAR } from "@/lib/asistente";

/** SP-17: mientras la instalación autoalojada no tenga administrador, la raíz lleva al asistente 31. */
export function RedirigeAConfigurar() {
  const router = useRouter();
  const modo = useModoInstalacion();
  const ir = debeIrAConfigurar(modo);

  useEffect(() => {
    if (ir) router.replace(RUTA_CONFIGURAR);
  }, [ir, router]);

  return null;
}
