"use client";

import { Check } from "lucide-react";

import { BloqueLimites } from "@/app/(admin)/admin/instalacion/_componentes/bloque-limites";
import { BloqueRegistro } from "@/app/(admin)/admin/instalacion/_componentes/bloque-registro";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Sondeo } from "@/hooks/use-sondeo";
import type { EstadoInstalacion } from "@/lib/admin-instalacion";

import { MarcoPaso } from "./marco-paso";

/**
 * Paso 5 · Registro y límites: los mismos bloques de Admin · Instalación (32, SP-18), con
 * `PATCH /admin/instalacion/registro` y `/limites` tal cual; la sesión es la del paso 2.
 */
export function PasoRegistro({
  instalacion,
  alVolver,
  alTerminar,
}: {
  instalacion: Sondeo<EstadoInstalacion>;
  alVolver: () => void;
  alTerminar: () => void;
}) {
  const { datos, error, recargar } = instalacion;

  return (
    <MarcoPaso
      titulo="Registro y límites"
      descripcion="Quién puede crear una cuenta y cuánto usa cada proyecto. Lo puedes cambiar después en Instalación."
      acciones={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={alVolver}>
            Atrás
          </Button>
          <Button type="button" size="sm" onClick={alTerminar}>
            <Check aria-hidden />
            Terminar
          </Button>
        </>
      }
    >
      {error ? (
        <Banner
          variant="bad"
          title="No pudimos leer el registro y los límites."
          actions={
            <Button variant="outline" size="sm" onClick={recargar}>
              Reintentar
            </Button>
          }
        />
      ) : null}
      {!datos && !error ? <Skeleton className="h-40 w-full" /> : null}
      {datos ? (
        // En la tarjeta del asistente no caben las dos columnas de la 32: título arriba, control debajo.
        <div className="flex flex-col md:[&_section]:grid-cols-1 md:[&_section]:gap-4 [&_section:first-child]:pt-0 [&_section:last-child]:border-b-0 [&_section:last-child]:pb-0">
          <BloqueRegistro registro={datos.registro} ahora={new Date()} alCambiar={recargar} />
          <BloqueLimites limites={datos.limites} alGuardar={recargar} />
        </div>
      ) : null}
    </MarcoPaso>
  );
}
