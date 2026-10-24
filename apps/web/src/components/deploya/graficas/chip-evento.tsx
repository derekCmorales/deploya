import React from "react";

interface ChipEventoProps {
  x: number;
  version: string;
  alto: number;
}

export function ChipEvento({ x, version, alto }: ChipEventoProps) {
  return (
    <g transform={`translate(${x}, 0)`} className="cursor-pointer group">
      <line
        x1="0"
        y1="0"
        x2="0"
        y2={alto}
        stroke="var(--foreground)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        strokeOpacity="0.6"
      />
      <foreignObject x="-12" y="4" width="24" height="16">
        <div className="flex items-center justify-center bg-foreground text-background font-mono text-[9px] tnum rounded px-1 py-0.5 shadow-sm">
          {version}
        </div>
      </foreignObject>
    </g>
  );
}