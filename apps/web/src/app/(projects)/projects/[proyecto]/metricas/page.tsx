"use client";

import React, { useState, use } from "react";
import { GraficaUso } from "@/components/deploya";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { estadoEnPalabra, deltaPorVersion, textoBanner } from "@/lib/metricas";

interface MetricasPageProps {
  params: Promise<{ proyecto: string }>;
}

export default function MetricasProyectoPage({ params }: MetricasPageProps) {
  const resolvedParams = use(params);
  const proyectoId = resolvedParams.proyecto;

  const [cargando, setCargando] = useState(false);
  const [ventana, setVentana] = useState<"1h" | "24h">("24h");

  const proyectoActivo = true; 
  const memoriaPct = 84;
  const memoriaVal = 430;
  const limiteMemoria = 512;
  const cpuVal = 35;
  const limiteCpu = 100;

  const cambiarVentana = (nuevaVentana: "1h" | "24h") => {
    if (nuevaVentana === ventana) return;
    setCargando(true);
    setVentana(nuevaVentana);
    setTimeout(() => setCargando(false), 300);
  };

  if (!proyectoActivo) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono text-sm">
        El contenedor no está corriendo.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {memoriaPct >= 80 && (
        <Banner
          variant="warn"
          title={textoBanner(memoriaPct, "Starter", deltaPorVersion(memoriaVal, 340, "MB"))}
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Comparar #13 y #14</Button>
              <Button size="sm">Cambiar plan</Button>
            </div>
          }
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={ventana === "1h" ? "default" : "outline"}
            size="sm"
            onClick={() => cambiarVentana("1h")}
          >
            1 h
          </Button>
          <Button
            variant={ventana === "24h" ? "default" : "outline"}
            size="sm"
            onClick={() => cambiarVentana("24h")}
          >
            24 h
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
          En vivo · una muestra por minuto
        </div>
      </div>

      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[220px] w-full rounded-lg" />
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Memoria RAM</span>
              <span className="font-semibold">{estadoEnPalabra(memoriaPct)}</span>
            </div>
            <GraficaUso
              titulo={`Memoria (${ventana})`}
              muestras={[
                { tiempo: "2026-10-23T10:00:00Z", valor: 340 },
                { tiempo: "2026-10-23T10:01:00Z", valor: memoriaVal },
              ]}
              limite={limiteMemoria}
              unidad="MB"
            />
            <p className="text-[11px] font-mono text-muted-foreground">▲ 90 MB desde #14</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Uso de CPU</span>
              <span className="font-semibold">{estadoEnPalabra(cpuVal)}</span>
            </div>
            <GraficaUso
              titulo={`CPU (${ventana})`}
              muestras={[
                { tiempo: "2026-10-23T10:00:00Z", valor: 20 },
                { tiempo: "2026-10-23T10:01:00Z", valor: cpuVal },
              ]}
              limite={limiteCpu}
              unidad="%"
            />
            <p className="text-[11px] font-mono text-muted-foreground">Pico registrado hace 15 min</p>
          </div>
        </div>
      )}
    </div>
  );
}