"use client";

import { useEffect, useState } from "react";
import { pedirApi, ErrorApi } from "@/lib/api";
import { textoReinicio } from "@/lib/actividad";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";

interface ConsumoData {
  periodo: { desde: string; reinicia: string };
  proyectos: { usados: number; limite: number };
  construcciones: { usadas: number; limite: number };
}

export function ConsumoPeriodo() {
  const [data, setData] = useState<ConsumoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pedirApi<ConsumoData>("/observabilidad/consumo")
      .then(setData)
      .catch((err) => setError(err instanceof ErrorApi ? err.message : "No pudimos cargar el consumo."));
  }, []);

  if (error) {
    return <div className="text-sm text-bad py-2">{error}</div>;
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4 py-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs text-muted-foreground">{textoReinicio(data.periodo.reinicia)}</span>
      <Meter label="Proyectos" value={data.proyectos.usados} max={data.proyectos.limite} tonoAlLimite="warn" />
      <Meter label="Construcciones" value={data.construcciones.usadas} max={data.construcciones.limite} />
      <p className="text-xs text-muted-foreground">
        Si llegas al límite, no podrás crear más proyectos ni lanzar más construcciones este mes.
      </p>
    </div>
  );
}
