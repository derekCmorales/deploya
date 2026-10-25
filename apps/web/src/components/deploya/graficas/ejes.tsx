interface MarcaY {
  y: number;
  texto: string;
}

interface MarcaX {
  x: number;
  texto: string;
}

interface EjesProps {
  ancho: number;
  alto: number;
  marcasY: MarcaY[];
  marcasX: MarcaX[];
}

/** Ejes de `GraficaUso`: rejilla suave en Y, valores en mono y horas en X. */
export function Ejes({ ancho, alto, marcasY, marcasX }: EjesProps) {
  return (
    <g className="select-none text-muted-foreground" aria-hidden="true">
      {marcasY.map((marca) => (
        <g key={`y-${marca.y}`}>
          <line x1="0" y1={marca.y} x2={ancho} y2={marca.y} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="2 4" />
          <text x="-8" y={marca.y + 3} textAnchor="end" className="fill-muted-foreground font-mono text-[10px] tnum">
            {marca.texto}
          </text>
        </g>
      ))}
      {marcasX.map((marca) => (
        <text key={`x-${marca.x}`} x={marca.x} y={alto + 15} textAnchor="middle" className="fill-muted-foreground font-mono text-[10px] tnum">
          {marca.texto}
        </text>
      ))}
    </g>
  );
}
