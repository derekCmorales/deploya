import type { CSSProperties } from "react";

/**
 * Colores del sistema como variables CSS: cambian solos con el tema (ver
 * ilustracion-registro.tsx). Equivalencias con el canvas: `--fg` = `--foreground`,
 * `--line-3` = `--border-stronger`.
 */
const TINTA = "var(--foreground)";
const SENAL = "var(--signal)";
const LINEA = "var(--border-stronger)";

/** Retrasos de la entrada (ms): las piezas llegan una tras otra y el halo empieza al final. */
const ENTRADA = { horizonte: 160, cuadro: 380, punto: 520, cuadroSenal: 640, halo: 1100 } as const;
/** El cuadro de Señal flota con otro ritmo que el punto. */
const DESFASE_CUADRO = "1.4s";

const trazo = (color: string, ancho: number): CSSProperties => ({ fill: "none", stroke: color, strokeWidth: ancho });
const relleno = (color: string): CSSProperties => ({ fill: color });
const retraso = (ms: number) => ({ "--retraso": `${ms}ms` }) as CSSProperties;
/** El halo y la flotación salen del `viewBox`; sin esto el navegador los corta arriba. */
const SIN_RECORTE: CSSProperties = { overflow: "visible" };

/**
 * Ilustración de acceso de la pantalla 03 (artboard `03-Iniciar sesión` del canvas v4.1).
 * Al abrir, la cúpula aparece, el horizonte se dibuja desde el centro (`dy-crece-centro`)
 * y los dos cuadros llegan uno tras otro (`dy-aparece`). Después el arco de rayas oscila
 * bajo la cúpula (`dy-oscila`), el punto flota (`dy-flota`) y respira (`dy-respira`), y
 * el cuadro de Señal flota desfasado. El punto se dibuja primero para quedar detrás de la
 * cúpula: en reposo se esconde un poco y al flotar asoma. El movimiento vive en
 * globals.css y se apaga con `prefers-reduced-motion`. Solo decora.
 */
export function IlustracionIngreso({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -8 360 360" aria-hidden="true" focusable="false" className={className} style={SIN_RECORTE}>
      <g className="dy-flota">
        <circle className="dy-respira" cx="180" cy="35" r="25" style={{ ...relleno(SENAL), ...retraso(ENTRADA.halo) }} />
        <circle className="dy-aparece" cx="180" cy="35" r="25" style={{ ...relleno(SENAL), ...retraso(ENTRADA.punto) }} />
      </g>
      <path className="dy-aparece" d="M44 187 A136 136 0 0 1 316 187 Z" style={relleno(TINTA)} />
      <line
        className="dy-crece-centro"
        x1="10"
        y1="197"
        x2="350"
        y2="197"
        style={{ ...trazo(TINTA, 1.4), ...retraso(ENTRADA.horizonte) }}
      />
      <path
        className="dy-oscila"
        d="M44 208 A136 136 0 0 0 316 208"
        style={{ ...trazo(LINEA, 1.4), strokeDasharray: "3 9" }}
      />
      <rect
        className="dy-aparece"
        x="21"
        y="276"
        width="10"
        height="10"
        style={{ ...relleno(TINTA), ...retraso(ENTRADA.cuadro) }}
      />
      <g className="dy-aparece" style={retraso(ENTRADA.cuadroSenal)}>
        <rect
          className="dy-flota"
          x="302"
          y="276"
          width="38"
          height="38"
          style={{ ...trazo(SENAL, 1.6), animationDelay: DESFASE_CUADRO }}
        />
      </g>
    </svg>
  );
}
