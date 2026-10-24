import React from "react";

interface EjesProps {
  ancho: number;
  alto: number;
  ticksY: number[];
  etiquetasX: string[];
}

export function Ejes({ ancho, alto, ticksY, etiquetasX }: EjesProps) {
  return (
    <g className="text-muted-foreground select-none" aria-hidden="true">
      {ticksY.map((tick, i) => {
        const y = alto - (i / (ticksY.length - 1 || 1)) * alto;
        return (
          <g key={`tick-y-${i}`}>
            <line
              x1="0"
              y1={y}
              x2={ancho}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeDasharray="2 2"
            />
            <text
              x="0"
              y={y - 4}
              className="font-mono text-[10px] tnum fill-muted-foreground"
            >
              {tick}
            </text>
          </g>
        );
      })}
    </g>
  );
}