import React from "react";

interface PuntoVivoSvgProps {
  cx: number;
  cy: number;
  tono?: "normal" | "aviso";
}

export function PuntoVivoSvg({ cx, cy, tono = "normal" }: PuntoVivoSvgProps) {
  const color = tono === "aviso" ? "var(--warn)" : "var(--foreground)";

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <circle
        cx="0"
        cy="0"
        r="6"
        fill={color}
        fillOpacity="0.3"
        className="animate-ping origin-center motion-reduce:animate-none"
      />
      <circle
        cx="0"
        cy="0"
        r="3"
        fill={color}
        stroke="var(--background)"
        strokeWidth="1.5"
      />
    </g>
  );
}