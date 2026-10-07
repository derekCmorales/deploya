import { ShieldX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/**
 * Pantalla 28 · 403 «solo para administración». Reutilizable: cualquier sección del panel
 * que la API responda con 403 `SoloAdministracion` la muestra con el rol de la sesión.
 */
export function SinPermisos({ rol }: { rol: string }) {
  return (
    <div className="grid place-items-center px-6 py-16">
      <Card className="flex w-[400px] max-w-full flex-col gap-4 p-7" role="alert">
        <span className="grid size-11 place-items-center rounded-lg border border-border">
          <ShieldX className="size-5 text-bad" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Esta sección es solo para administración</h1>
        <p className="text-muted-foreground">
          Tu cuenta es de tipo <Badge variant="outline">{rol}</Badge>. Si crees que es un error, escribe a{" "}
          <a href="mailto:soporte@deploya.app" className="font-medium text-foreground underline-offset-[3px] hover:underline">
            soporte@deploya.app
          </a>
          .
        </p>
      </Card>
    </div>
  );
}
