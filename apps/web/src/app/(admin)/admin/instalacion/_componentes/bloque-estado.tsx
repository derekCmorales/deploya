"use client";

import { CircleAlert, CircleCheck, CircleX, Clock, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { nombreComprobacion, textoComprobado, type Comprobacion, type EstadoComprobacion } from "@/lib/admin-instalacion";

import { FilaAjuste } from "./fila-ajuste";

const ICONO: Record<EstadoComprobacion, { Icono: typeof CircleCheck; tono: string; texto: string }> = {
  ok: { Icono: CircleCheck, tono: "text-ok", texto: "Bien" },
  aviso: { Icono: CircleAlert, tono: "text-warn", texto: "Con aviso" },
  error: { Icono: CircleX, tono: "text-bad", texto: "Con error" },
};

/** Estado: una fila por comprobación del Composite `SaludInstalacion`. */
export function BloqueEstado({
  salud,
  comprobado,
  ahora,
  alComprobar,
}: {
  salud: Comprobacion[];
  comprobado: string;
  ahora: Date;
  alComprobar: () => void;
}) {
  return (
    <FilaAjuste titulo="Estado" descripcion="Lo que deploya necesita para funcionar. Se comprueba cada 10 minutos.">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <span className="flex flex-1 items-center gap-1.5 text-[13px] text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            {textoComprobado(comprobado, ahora)}
          </span>
          <Button variant="ghost" size="xs" onClick={alComprobar}>
            <RefreshCw />
            Volver a comprobar
          </Button>
        </div>
        <ul>
          {salud.map((c) => {
            const { Icono, tono, texto } = ICONO[c.estado];
            return (
              <li key={c.id} className="flex items-center gap-3 border-t border-border px-4 py-3">
                <Icono className={`size-4 shrink-0 ${tono}`} aria-label={texto} />
                <span className="w-[180px] shrink-0 text-sm font-medium">{nombreComprobacion(c.id)}</span>
                <span className="min-w-0 flex-1 text-[13px] text-muted-foreground">{c.detalle}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </FilaAjuste>
  );
}
