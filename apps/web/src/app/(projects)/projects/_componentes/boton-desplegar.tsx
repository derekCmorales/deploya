"use client";

import { Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorApi, pedirApi } from "@/lib/api";
import { rutaDespliegue } from "@/lib/despliegues";

/** «Desplegar»: crea un despliegue manual y lleva a la pantalla 12 del nuevo; un bloqueo de M5 se explica en línea. */
export function BotonDesplegar({ proyectoId }: { proyectoId: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const desplegar = async () => {
    setOcupado(true);
    setError(null);
    try {
      const creado = await pedirApi<{ numero: number }>(`/proyectos/${proyectoId}/despliegues`, { metodo: "POST" });
      router.push(rutaDespliegue(proyectoId, creado.numero));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : "No pudimos iniciar el despliegue.");
      setOcupado(false);
    }
  };
  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" size="sm" disabled={ocupado} onClick={desplegar}>
        <Rocket />
        Desplegar
      </Button>
      {error ? <p className="max-w-xs text-right text-xs text-bad">{error}</p> : null}
    </div>
  );
}
