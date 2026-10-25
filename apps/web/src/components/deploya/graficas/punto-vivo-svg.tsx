interface PuntoVivoSvgProps {
  cx: number;
  cy: number;
}

/** Único punto con Señal y pulso de la gráfica: el dato de «ahora» (regla 3). */
export function PuntoVivoSvg({ cx, cy }: PuntoVivoSvgProps) {
  return (
    <g transform={`translate(${cx}, ${cy})`} aria-hidden="true">
      <circle r="6" fill="var(--signal)" fillOpacity="0.28" className="animate-ping motion-reduce:animate-none" />
      <circle r="3" fill="var(--signal)" stroke="var(--background)" strokeWidth="1.5" />
    </g>
  );
}
