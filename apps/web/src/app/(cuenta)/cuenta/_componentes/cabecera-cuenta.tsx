"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TabsNav } from "@/components/ui/tabs";
import { useSesion } from "@/hooks/use-sesion";
import { RUTA_CUENTA, RUTA_SEGURIDAD } from "@/lib/mi-cuenta";

/** Cabecera común de 05 y 05b: eyebrow, título, «Nombre · correo» y las pestañas Perfil · Seguridad. */
export function CabeceraCuenta() {
  const { usuario } = useSesion();
  const ruta = usePathname();

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-muted-foreground">Cuenta</p>
        <h1 className="text-[28px] leading-[34px] font-semibold tracking-[-0.032em]">Mi cuenta</h1>
        <p className="text-muted-foreground">{usuario ? `${usuario.nombre} · ${usuario.correo}` : " "}</p>
      </header>
      <TabsNav aria-label="Secciones de la cuenta">
        <Link href={RUTA_CUENTA} aria-current={ruta === RUTA_CUENTA ? "page" : undefined}>
          Perfil
        </Link>
        <Link href={RUTA_SEGURIDAD} aria-current={ruta === RUTA_SEGURIDAD ? "page" : undefined}>
          Seguridad
        </Link>
      </TabsNav>
    </>
  );
}
