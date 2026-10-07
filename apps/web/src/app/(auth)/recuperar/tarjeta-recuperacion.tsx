import { CircleX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Tarjeta de 04 (patrón B): ícono en recuadro, título y contenido. */
export function TarjetaRecuperacion({
  icono,
  titulo,
  descripcion,
  tono = "neutro",
  children,
}: {
  icono: ReactNode;
  titulo: string;
  descripcion?: ReactNode;
  tono?: "neutro" | "malo";
  children?: ReactNode;
}) {
  return (
    <Card className="flex w-[400px] max-w-full flex-col gap-4 p-7">
      <span
        className={cn(
          "grid size-11 place-items-center rounded-lg border [&_svg]:size-5",
          tono === "malo" ? "border-bad/40 bg-[color-mix(in_oklab,var(--bad)_10%,transparent)] text-bad" : "border-border bg-sunken",
        )}
      >
        {icono}
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{titulo}</h1>
        {descripcion ? <p className="text-muted-foreground">{descripcion}</p> : null}
      </div>
      {children}
    </Card>
  );
}

/** Estado «Token usado o expirado» de 04: lo usa `/restablecer` sin token o tras un 410. */
export function EnlaceNoSirve() {
  return (
    <TarjetaRecuperacion
      icono={<CircleX aria-hidden />}
      tono="malo"
      titulo="Este enlace ya no sirve"
      descripcion="Ya se usó o pasaron más de 30 minutos. Pide uno nuevo para continuar."
    >
      <Button asChild size="lg" className="w-full">
        <Link href="/recuperar">Pedir un enlace nuevo</Link>
      </Button>
    </TarjetaRecuperacion>
  );
}
