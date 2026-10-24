import React from "react";

interface TooltipProps {
  x: number;
  y: number;
  hora: string;
  valor: number | string;
  porcentaje?: number;
  version?: string;
  anchoContenedor: number;
}

export function TooltipGrafica({ x, y, hora, valor, porcentaje, version, anchoContenedor }: TooltipProps) {
  const alignRight = x > anchoContenedor - 120;
  const transformX = alignRight ? x - 110 : x + 10;

  return (
    <g transform={`translate(${transformX}, ${Math.max(10, y - 40)})`} className="pointer-events-none transition-transform duration-75">
      <foreignObject width="110" height="65">
        <div className="bg-foreground text-background dark:bg-card dark:text-card-foreground border border-border rounded p-1.5 text-[10px] font-mono tnum shadow-md">
          <div className="font-semibold text-muted-foreground">{hora}</div>
          <div>Valor: <span className="font-bold">{valor}</span></div>
          {porcentaje !== undefined && (
            <div>Uso: <span className="font-bold">{porcentaje}%</span></div>
          )}
          {version && (
            <div className="text-muted-foreground text-[9px]">Ref: {version}</div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}