"use client";

import React, { useState, useRef } from "react";
import { escalaLineal } from "./escalas";
import { puntosDeSerie, tonoDeUso, MuestraSerie, EventoDespliegue } from "./series";
import { PuntoVivoSvg } from "./punto-vivo-svg";
import { ChipEvento } from "./chip-evento";
import { TooltipGrafica } from "./tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface GraficaUsoProps {
  titulo: string;
  muestras: MuestraSerie[];
  limite: number;
  unidad: string;
  eventos?: EventoDespliegue[];
  compacta?: boolean;
}

export function GraficaUso({ titulo, muestras, limite, unidad, eventos = [], compacta = false }: GraficaUsoProps) {
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState<number | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const ancho = 400;
  const alto = compacta ? 100 : 180;
  const margen = { top: 10, right: 40, bottom: 20, left: 10 };
  const wGrafica = ancho - margen.left - margen.right;
  const hGrafica = alto - margen.top - margen.bottom;

  const maxValor = Math.max(limite * 1.1, ...muestras.map(m => m.valor), 1);
  const escalaY = escalaLineal([0, maxValor], [hGrafica, 0]);
  const escalaX = escalaLineal([0, Math.max(1, muestras.length - 1)], [0, wGrafica]);

  const yAviso = escalaY(limite * 0.8);
  const yLimite = escalaY(limite);
  const segmentos = puntosDeSerie(muestras);

  const ultimoPunto = muestras[muestras.length - 1];
  const ultimoX = muestras.length > 1 ? escalaX(muestras.length - 1) : 0;
  const ultimoY = ultimoPunto ? escalaY(ultimoPunto.valor) : 0;
  const tonoActual = ultimoPunto ? tonoDeUso(ultimoPunto.valor, limite) : "normal";

  const resumenAria = `${titulo} - Último valor: ${ultimoPunto?.valor ?? 0} ${unidad}, Límite: ${limite} ${unidad}.`;

  const manejarKeyDown = (e: React.KeyboardEvent) => {
    if (muestras.length === 0) return;
    if (e.key === "ArrowRight") {
      setIndiceActivo(prev => (prev === null || prev >= muestras.length - 1 ? 0 : prev + 1));
    } else if (e.key === "ArrowLeft") {
      setIndiceActivo(prev => (prev === null || prev <= 0 ? muestras.length - 1 : prev - 1));
    } else if (e.key === "Escape") {
      setIndiceActivo(null);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{titulo}</h4>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tnum text-muted-foreground">
            {limite} {unidad} · límite
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
                <TableHead className="font-mono text-xs">Hora</TableHead>
                <TableHead className="font-mono text-xs text-right">Valor ({unidad})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {muestras.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{m.tiempo}</TableCell>
                  <TableCell className="font-mono text-xs text-right tnum">{m.valor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div
          tabIndex={0}
          role="img"
          aria-label={resumenAria}
          onKeyDown={manejarKeyDown}
          ref={contenedorRef}
          className="relative outline-none focus:ring-1 focus:ring-ring rounded"
        >
          <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-auto overflow-visible">
            <defs>
              <clipPath id={`clip-aviso-${titulo}`}>
                <rect x="0" y="0" width={wGrafica} height={yAviso} />
              </clipPath>
            </defs>

            <g transform={`translate(${margen.left}, ${margen.top})`}>
              <rect
                x="0"
                y={yAviso}
                width={wGrafica}
                height={yLimite - yAviso}
                fill="var(--warn)"
                fillOpacity="0.08"
              />
              <line
                x1="0"
                y1={yAviso}
                x2={wGrafica}
                y2={yAviso}
                stroke="var(--warn)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              <line
                x1="0"
                y1={yLimite}
                x2={wGrafica}
                y2={yLimite}
                stroke="var(--muted-foreground)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={wGrafica + 4}
                y={yLimite + 3}
                className="font-mono text-[9px] tnum fill-muted-foreground"
              >
                {limite} {unidad}
              </text>

              {segmentos.map((seg, sIdx) => {
                const puntosStr = seg
                  .map(pt => {
                    const originalIdx = muestras.indexOf(pt);
                    return `${escalaX(originalIdx)},${escalaY(pt.valor)}`;
                  })
                  .join(" ");

                return (
                  <g key={sIdx}>
                    <polyline
                      fill="none"
                      stroke="var(--foreground)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={puntosStr}
                    />
                  </g>
                );
              })}

              {eventos.map((ev, eIdx) => {
                const ex = escalaX(eIdx * 2);
                if (ex < 0 || ex > wGrafica) return null;
                return <ChipEvento key={eIdx} x={ex} version={ev.version} alto={hGrafica} />;
              })}

              {ultimoPunto && (
                <PuntoVivoSvg cx={ultimoX} cy={ultimoY} tono={tonoActual} />
              )}

              {indiceActivo !== null && muestras[indiceActivo] && (
                <g>
                  <line
                    x1={escalaX(indiceActivo)}
                    y1="0"
                    x2={escalaX(indiceActivo)}
                    y2={hGrafica}
                    stroke="var(--muted-foreground)"
                    strokeWidth="1"
                  />
                  <circle
                    cx={escalaX(indiceActivo)}
                    cy={escalaY(muestras[indiceActivo].valor)}
                    r="4"
                    fill="var(--foreground)"
                  />
                  <TooltipGrafica
                    x={escalaX(indiceActivo)}
                    y={escalaY(muestras[indiceActivo].valor)}
                    hora={muestras[indiceActivo].tiempo}
                    valor={`${muestras[indiceActivo].valor} ${unidad}`}
                    porcentaje={Math.round((muestras[indiceActivo].valor / limite) * 100)}
                    anchoContenedor={wGrafica}
                  />
                </g>
              )}
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}