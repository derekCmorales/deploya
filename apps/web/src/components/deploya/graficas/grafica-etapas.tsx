"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface EtapaConstruccion {
  nombre: string;
  duracionSeg: number;
  estado: "exito" | "fallo" | "activo";
}

interface GraficaEtapasProps {
  titulo: string;
  etapas: EtapaConstruccion[];
}

export function GraficaEtapas({ titulo, etapas }: GraficaEtapasProps) {
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const totalSeg = etapas.reduce((acc, e) => acc + e.duracionSeg, 0) || 1;
  const resumenAria = `${titulo} - Duración total: ${totalSeg}s en ${etapas.length} etapas.`;

  return (
    <div className="border border-border rounded-lg p-4 bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">{titulo}</h4>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tnum text-muted-foreground">{totalSeg}s total</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs font-mono"
            onClick={() => setMostrarTabla(!mostrarTabla)}
          >
            {mostrarTabla ? "Ver barras" : "Ver tabla"}
          </Button>
        </div>
      </div>

      {mostrarTabla ? (
        <div className="max-h-[160px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs">Etapa</TableHead>
                <TableHead className="font-mono text-xs text-right">Duración (s)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {etapas.map((et, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{et.nombre}</TableCell>
                  <TableCell className="font-mono text-xs text-right tnum">{et.duracionSeg}s</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div role="img" aria-label={resumenAria} className="space-y-2">
          <div className="flex h-6 w-full rounded overflow-hidden bg-muted gap-0.5 p-0.5">
            {etapas.map((et, idx) => {
              const pct = (et.duracionSeg / totalSeg) * 100;
              const bgClass =
                et.estado === "fallo"
                  ? "bg-destructive"
                  : et.estado === "activo"
                  ? "bg-warn animate-pulse"
                  : "bg-foreground";

              return (
                <div
                  key={idx}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                  className={`${bgClass} h-full rounded-sm transition-all relative group cursor-pointer`}
                  title={`${et.nombre}: ${et.duracionSeg}s (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-mono text-muted-foreground">
            {etapas.map((et, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-foreground" />
                <span>{et.nombre} ({et.duracionSeg}s)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}