"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSesion } from "@/hooks/use-sesion";

export const RUTA_INGRESAR = "/ingresar";

/** Derecha del header: el usuario con sesión y «Salir», o «Iniciar sesión». */
export function MenuUsuario() {
  const { estado, usuario, salir } = useSesion();
  const router = useRouter();

  if (estado === "cargando") return <Skeleton className="h-8 w-24" />;
  if (!usuario) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={RUTA_INGRESAR}>Iniciar sesión</Link>
      </Button>
    );
  }

  async function cerrar() {
    await salir();
    router.replace(RUTA_INGRESAR);
  }

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-full border border-border bg-sunken text-xs font-medium"
      >
        {usuario.nombre.charAt(0).toUpperCase()}
      </span>
      <span className="hidden text-sm sm:inline" title={usuario.correo}>
        {usuario.nombre}
      </span>
      <Button variant="ghost" size="sm" onClick={() => void cerrar()} aria-label="Cerrar sesión">
        <LogOut aria-hidden />
        <span className="hidden sm:inline">Salir</span>
      </Button>
    </div>
  );
}
