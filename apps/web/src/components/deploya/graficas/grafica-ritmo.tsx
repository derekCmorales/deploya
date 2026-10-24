"use client";

import React, { useState } from "react";
import { escalaLineal } from "./escalas";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface MuestraRitmo {
  dia: string;
  acumulado: number;
}

interface GraficaRitmoProps {
  titulo: string;
  muestras: MuestraRitmo[];
  cuotaMax: number;
  unidad: string;
}

export function GraficaRitmo({ titulo, muestras, cuotaMax, unidad }: GraficaRitmoProps) {
  const [mostrarTabla, setMostrarTabla] = useState(false);

  const ancho = 400;
  const alto = 160;
  const margen = { top: 10, right: 40, bottom: 20, left: 10 };
  const wGrafica = ancho - margen.left - margen.right;
  const hGrafica = alto - margen.top - margen.bottom;

  const maxValor = Math.max(cuotaMax, ...muestras.map(m => m.acumulado), 1);
  const escalaY = escalaLineal([0, maxValor], [hGrafica, 0]);
  const escalaX = escalaLineal([0, Math.max(1, muestras.length - 1)], [0, wGrafica]);

  const yCuota = escalaY(cuotaMax);
  const puntosStr = muestras.map((m, i) => `${escalaX(i)},${escalaY(m.acumulado)}`).join(" ");
  const resumenAria = `${titulo} - Cuota máxima: ${cuotaMax} ${unidad}.`;

  return (
    <div className="border border-border rounded-lg p-4 bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{titulo}</h4>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tnum text-muted-foreground">
            Cuota: {cuotaMax} {unidad}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs font-mono"
            onClick={() => setMostrarTabla(!mostrarTabla)}
          >
            {mostrarTabla ? "Ver gráfica" : "Ver tabla"}
          </Button>
        </div>
      </div>

      {mostrarTabla ? (
        <div className="max-h-[160px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs">Día</TableHead>
                <TableHead className="font-mono text-xs text-right">Acumulado ({unidad})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {muestras.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{m.dia}</TableCell>
                  <TableCell className="font-mono text-xs text-right tnum">{m.acumulado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div role="img" aria-label={resumenAria}>
          <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-auto overflow-visible">
            <g transform={`translate(${margen.left}, ${margen.top})`}>
              <line
                x1="0"
                y1={yCuota}
                x2={wGrafica}
                y2={yCuota}
                stroke="var(--warn)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={wGrafica + 4}
                y={yCuota + 3}
                className="font-mono text-[9px] tnum fill-warn"
              >
                Cuota {cuotaMax}
              </text>
              <polyline
                fill="none"
                stroke="var(--foreground)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={puntosStr}
              />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}