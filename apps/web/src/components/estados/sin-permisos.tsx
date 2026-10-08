import { ShieldX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Pantalla 28 · 403 «solo para administración». Reutilizable: cualquier sección del panel
 * que la API responda con 403 `SoloAdministracion` la muestra con el rol de la sesión.
 */
export function SinPermisos({ rol }: { rol: string }) {
  return (
    <section
      className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center gap-3.5 bg-sunken px-8 py-16 text-center"
      role="alert"
    >
      <span className="grid size-12 place-items-center rounded-xl border border-border-strong bg-card text-muted-foreground">
        <ShieldX className="size-5" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold tracking-[-0.02em]">Esta sección es solo para administración</h1>
      <p className="max-w-[400px] text-muted-foreground">
        Tu cuenta es de tipo <span className="font-medium text-foreground">{rol}</span>. Si crees que es un error, escribe a{" "}
        <a href="mailto:soporte@deploya.app" className="font-mono text-[13px] text-foreground underline-offset-[3px] hover:underline">
          soporte@deploya.app
        </a>
        .
      </p>
      <Button asChild size="sm">
        <Link href="/projects">Ir a proyectos</Link>
      </Button>
    </section>
  );
}
