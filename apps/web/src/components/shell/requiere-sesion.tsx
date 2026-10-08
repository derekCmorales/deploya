"use client";

import { LogIn, RotateCw, TimerOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSesion } from "@/hooks/use-sesion";
import { destinoSinSesion } from "@/lib/sesion-expirada";

/**
 * Rutas del panel (M1-03): sin sesión vigente se va a `/ingresar` y se vuelve después. Si la
 * sesión venció mientras se usaba el panel, el diálogo «Tu sesión expiró» (M1-04, 28) queda
 * sobre el panel y lleva a `/ingresar?expirada=1`, que vuelve a esta misma página.
 */
export function RequiereSesion({ children }: { children: ReactNode }) {
  const { estado, expirada, recargar } = useSesion();
  const router = useRouter();
  const ruta = usePathname();

  const destino = destinoSinSesion(expirada, ruta);

  useEffect(() => {
    if (estado === "sin-sesion" && !expirada) router.replace(destino);
  }, [estado, expirada, destino, router]);

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
  const vencida = estado === "sin-sesion" && expirada;
  return (
    <>
      <div
        className={vencida ? "flex flex-col gap-3 px-8 pt-6 opacity-35" : "flex flex-col gap-3 px-8 pt-6"}
        aria-busy={!vencida}
        aria-label={vencida ? undefined : "Comprobando la sesión"}
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
      {vencida ? <SesionExpirada destino={destino} alCerrar={() => router.replace(destino)} /> : null}
    </>
  );
}

/** Pantalla 28 · Sesión expirada: diálogo sobre el panel; cerrarlo también lleva a iniciar sesión. */
function SesionExpirada({ destino, alCerrar }: { destino: string; alCerrar: () => void }) {
  const accion = useRef<HTMLAnchorElement>(null);
  // Corre después del `showModal()` del diálogo: el foco va a la acción principal, no a «Cerrar».
  useEffect(() => accion.current?.focus(), []);
  return (
    <Dialog
      open
      onOpenChange={(abierto) => {
        if (!abierto) alCerrar();
      }}
      className="w-[min(380px,calc(100vw-32px))]"
      title={
        <span className="flex flex-col gap-4">
          <span className="grid size-10 place-items-center rounded-lg border border-border-strong">
            <TimerOff className="size-5" aria-hidden />
          </span>
          Tu sesión expiró
        </span>
      }
      description="Por seguridad cerramos las sesiones tras 7 días sin actividad. Inicia sesión de nuevo y volverás a esta página."
    >
      <Button asChild size="lg" className="w-full">
        <Link href={destino} ref={accion}>
          <LogIn aria-hidden />
          Iniciar sesión
        </Link>
      </Button>
    </Dialog>
  );
}
