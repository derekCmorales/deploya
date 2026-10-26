"use client";

import { ArrowRight, Globe } from "lucide-react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sondeo } from "@/hooks/use-sondeo";
import type { EstadoInstalacion } from "@/lib/admin-instalacion";

import { MarcoPaso } from "./marco-paso";

/**
 * Paso 3 · Dominio y HTTPS: solo lectura; lo dejó listo `instalar.sh` (sale de `GET /admin/instalacion`).
 * Versión, certificado y servidor van en el panel lateral, como en el artboard 31.
 */
export function PasoDominio({ instalacion, alContinuar }: { instalacion: Sondeo<EstadoInstalacion>; alContinuar: () => void }) {
  const { datos, error, recargar } = instalacion;

  const certificado = datos?.salud.find((c) => c.id === "certificado");
  const dns = datos?.salud.find((c) => c.id === "dns");

  return (
    <MarcoPaso
      titulo="Dominio y HTTPS"
      descripcion="Lo configuró el instalador. Para cambiar el dominio, vuelve a correr ./scripts/instalar.sh."
      acciones={
        <>
          <span />
          <Button type="button" size="sm" onClick={alContinuar}>
            Continuar
            <ArrowRight aria-hidden />
          </Button>
        </>
      }
    >
      {error ? (
        <Banner
          variant="bad"
          title="No pudimos leer el estado de la instalación."
          actions={
            <Button variant="outline" size="sm" onClick={recargar}>
              Reintentar
            </Button>
          }
        />
      ) : null}
      {!datos && !error ? <Skeleton className="h-24 w-full" /> : null}
      {datos ? (
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="size-4 text-muted-foreground" aria-hidden />
            <span className="font-mono">{datos.dominio} · comodín</span>
          </div>
          <dl className="flex flex-col gap-2 text-[13px]">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Comodín</dt>
              <dd>{dns?.detalle ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Certificado</dt>
              <dd>{certificado?.detalle ?? "—"}</dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </MarcoPaso>
  );
}
