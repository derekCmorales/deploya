interface TooltipGraficaProps {
  x: number;
  y: number;
  hora: string;
  valor: string;
  porcentaje: number;
  version: string | null;
  anchoContenedor: number;
  altoContenedor: number;
}

const ANCHO_TOOLTIP = 132;
const ALTO_TOOLTIP = 78;
const MARGEN = 8;

/** Tooltip de un punto: hora, valor, % del límite y versión vigente. */
export function TooltipGrafica({ x, y, hora, valor, porcentaje, version, anchoContenedor, altoContenedor }: TooltipGraficaProps) {
  const aLaDerecha = x < anchoContenedor - ANCHO_TOOLTIP - MARGEN;
  const izquierda = aLaDerecha ? x + MARGEN : x - ANCHO_TOOLTIP - MARGEN;
  const arriba = Math.max(0, Math.min(y - ALTO_TOOLTIP / 2, altoContenedor - ALTO_TOOLTIP));

  return (
    <g transform={`translate(${Math.max(0, izquierda)}, ${arriba})`} className="pointer-events-none">
      <foreignObject width={ANCHO_TOOLTIP} height={ALTO_TOOLTIP}>
        <div className="flex flex-col gap-0.5 rounded-md border border-border-strong bg-popover p-2 font-mono text-[10px] text-popover-foreground shadow-elev">
          <span className="font-medium text-muted-foreground">{hora}</span>
          <span>
            Valor: <span className="font-semibold">{valor}</span>
          </span>
          <span>
            Uso: <span className="font-semibold tnum">{porcentaje} % del límite</span>
          </span>
          {version ? <span className="text-muted-foreground">Versión {version}</span> : null}
        </div>
      </foreignObject>
    </g>
  );
}
