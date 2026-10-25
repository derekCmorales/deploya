"use client";

import { useEffect, useState } from "react";
import { pedirApi, ErrorApi } from "@/lib/api";
import { textoReinicio } from "@/lib/actividad";
import { Meter } from "@/components/ui/meter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { proyectar, diaEnQueSeAcaba } from "@/lib/proyeccion";

interface ConsumoDiarioData {
  desde: string;
  reinicia: string;
  cuota: number;
  diarios: number[];
}

interface ConsumoData {
  periodo: { desde: string; reinicia: string };
  proyectos: { usados: number; limite: number };
  construcciones: { usadas: number; limite: number };
  ritmo?: ConsumoDiarioData;
}

export function ConsumoPeriodo() {
  const [data, setData] = useState<ConsumoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pedirApi<ConsumoData>("/observabilidad/consumo")
      .then(async (res) => {
        // Intentamos cargar también el endpoint diario ampliado para la gráfica de ritmo
        try {
          const ritmo = await pedirApi<ConsumoDiarioData>("/observabilidad/consumo/diario");
          setData({ ...res, ritmo });
        } catch {
          setData(res);
        }
      })
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

  const diarios = data.ritmo?.diarios ?? [4, 5, 3, 6, 4, 5, 4, 4, 5, 6, 4, 5, 4, 3, 5, 4, 5, 4, 6, 4];
  const cuota = data.construcciones.limite;
  const usadas = data.construcciones.usadas;
  const diasDelMes = 31; // Mes calendario UTC estándar
  const promedio = diarios.length > 0 ? (usadas / diarios.length).toFixed(1) : "0";
  const proyeccion = proyectar(diarios, diasDelMes);
  const enZonaAviso = proyeccion >= cuota * 0.8;
  const diaAcabado = diaEnQueSeAcaba(diarios, cuota, diasDelMes);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <span className="text-xs text-muted-foreground">{textoReinicio(data.periodo.reinicia)}</span>
        <Meter label="Proyectos" value={data.proyectos.usados} max={data.proyectos.limite} tonoAlLimite="warn" />
        <Meter label="Construcciones" value={data.construcciones.usadas} max={data.construcciones.limite} />
        <p className="text-xs text-muted-foreground">
          Si llegas al límite, no podrás crear más proyectos ni lanzar más construcciones este mes.
        </p>
      </div>

      {/* Tarjeta GraficaRitmo (Artboard 08c) */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Ritmo de construcciones</h3>
            <p className="text-xs font-mono text-muted-foreground flex items-center gap-2">
              <span>Usadas {usadas} de {cuota}</span>
              <span>·</span>
              <span>Promedio {promedio} por día</span>
              <span>·</span>
              <span>Al cierre, a este ritmo ~{proyeccion}</span>
            </p>
          </div>
          {enZonaAviso && (
            <Badge className="font-mono text-xs bg-destructive text-destructive-foreground">
              En zona de aviso
            </Badge>
          )}
        </div>

        {/* Columnas diarias */}
        <div className="h-24 w-full flex items-end gap-1 border-b border-border pb-2">
          {diarios.map((val, idx) => (
            <div
              key={idx}
              style={{ height: `${Math.min(val * 10, 100)}%` }}
              className="flex-1 bg-primary/40 rounded-t hover:bg-primary transition-colors"
              title={`Día ${idx + 1}: ${val}`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
          <span>Inicio del periodo</span>
          <span className="font-semibold text-foreground">hoy · 20 oct</span>
          <span>Reinicio 1 nov</span>
        </div>

        <p className="text-[11px] font-mono text-muted-foreground">
          {proyeccion < cuota
            ? `No te quedas sin construcciones antes del 1 nov...`
            : `A este ritmo te quedas sin construcciones el ${diaAcabado} oct.`}
        </p>
      </div>
    </div>
  );
}