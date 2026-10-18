"use client";

import { useEffect, useState } from "react";
import { pedirApi, ErrorApi } from "@/lib/api";
import { textoActividad } from "@/lib/actividad";
import { MapaActividad } from "@/components/deploya/mapa-actividad";
import { Skeleton } from "@/components/ui/skeleton";

interface ActividadData {
  dias: { fecha: string; total: number; fallidos: number }[];
  total: number;
  fallidos: number;
}

export function ActividadProyecto({ proyectoId }: { proyectoId: string }) {
  const [data, setData] = useState<ActividadData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pedirApi<ActividadData>(`/proyectos/${proyectoId}/actividad`)
      .then(setData)
      .catch((err) => setError(err instanceof ErrorApi ? err.message : "No pudimos cargar la actividad."));
  }, [proyectoId]);

  if (error) {
    return <div className="text-sm text-bad py-2">{error}</div>;
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{textoActividad(data.dias)}</h3>
      <MapaActividad dias={data.dias} />
    </div>
  );
}